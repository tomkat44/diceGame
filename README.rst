System & Network Security Assignment
====================================

*These instructions are for Debian/Ubuntu.*

Dependencies
------------

.. code:: bash

   sudo apt-get update
   sudo apt-get install -yq pkgconf fonts-noto-core apache2 \
      python3{,-pip,-venv} mariadb-server lib{mariadb,mysqlclient}-dev

Backend
-------

Set up MySQL database
^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo mysql -u root -p < backend/initdb.sql

Create JWT keys
^^^^^^^^^^^^^^^

.. code:: bash

   openssl genrsa -out backend/keys/private.pem 4096
   openssl rsa -in backend/keys/private.pem -pubout -out backend/keys/public.pem
   chmod 400 backend/keys/private.pem

Copy directory
^^^^^^^^^^^^^^

.. code:: bash

   sudo mkdir -p /var/www/html
   sudo rsync -Eav . /var/www/html/digidice --chown=www-data:www-data \
      --exclude=config/apache2.conf --exclude=config/uwsgi.service \
      --exclude=backend/initdb.sql --exclude=README.rst --exclude=.git*

Set up project
^^^^^^^^^^^^^^

.. code:: bash

   pushd /var/www/html/digidice/backend
   sudo -uwww-data python3 -mvenv .venv
   sudo -uwww-data .venv/bin/python -mpip install --no-cache --use-pep517 -e .[uwsgi]
   sudo -uwww-data .venv/bin/python manage.py migrate
   sudo -uwww-data .venv/bin/python manage.py createsuperuser --username admin
   popd

Create TLS keys & certificates
------------------------------

Create CA key & certificate
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   openssl ecparam -name secp384r1 -genkey -out /tmp/netsec.key
   openssl req -x509 -new -nodes -sha256 -days 90 -key /tmp/netsec.key \
       -out /tmp/netsec.crt -subj '/CN=NetSec/C=GR/ST=Attiki/L=Athina/O=AUEB'
   chmod 400 /tmp/netsec.key

Create server key & CSR
^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   openssl ecparam -name secp384r1 -genkey -out /tmp/server.key
   openssl req -new -nodes -sha256 -key /tmp/server.key -out /tmp/server.csr \
       -subj '/CN=localhost/C=GR/ST=Attiki/L=Athina/O=AUEB/OU=MSCIS' \
       -addext 'subjectAltName=DNS:backend.localhost,DNS:frontend.localhost,IP:127.0.0.1'
   chmod 400 /tmp/server.key

Sign server certificate with CA
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   openssl x509 -req -sha256 -days 30 -CAcreateserial \
       -CA /tmp/netsec.crt -CAkey /tmp/netsec.key -in /tmp/server.csr -out /tmp/server.crt \
       -extfile <(printf 'subjectAltName=DNS:backend.localhost,DNS:frontend.localhost,IP:127.0.0.1')

Generate Diffie-Hellman parameters
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   openssl dhparam -out /tmp/dhparams.pem 2048

Move server certificate files
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo mkdir /etc/apache2/ssl
   sudo chmod 710 /etc/apache2/ssl
   sudo mv /tmp/server.{crt,key} /etc/apache2/ssl
   sudo mv /tmp/dhparams.pem /etc/apache2/ssl
   sudo chown -R root:root /etc/apache2/ssl

Store CA key & certificate
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo mv /tmp/netsec.key /etc/ssl/private
   sudo mv /tmp/netsec.crt /usr/local/share/ca-certificates
   sudo update-ca-certificates

Apache
------

Copy configuration
^^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo ln -s /usr/lib/apache2/modules /etc/apache2
   sudo cp config/apache2.conf /etc/apache2/apache2.conf
   sudo chown root:root /etc/apache2/apache2.conf

Start uWSGI
^^^^^^^^^^^

.. code:: bash

   sudo mkdir -p /var/run/uwsgi /etc/uwsgi
   sudo chown www-data:www-data /var/run/uwsgi
   sudo mv /var/www/html/digidice/config/uwsgi.xml /etc/uwsgi
   sudo /var/www/html/digidice/backend/.venv/bin/uwsgi --xml /etc/uwsgi/uwsgi.xml

Start Apache
^^^^^^^^^^^^

.. code:: bash

   sudo systemctl restart apache2
