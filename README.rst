System & Network Security Assignment
====================================

Backend
-------

.. code:: bash

   cd backend

Set up MySQL database
^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   mysql -u root -p < initdb.sql

Set up virtual environment
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   python -mvenv .venv
   source .venv/bin/activate

Install project
^^^^^^^^^^^^^^^

.. code:: bash

   pip install -e .
   python manage.py migrate
   python manage.py createsuperuser --username admin

Create JWT keys
^^^^^^^^^^^^^^^

.. code:: bash

   openssl genrsa -out keys/private.pem 4096
   openssl rsa -in keys/private.pem -pubout -out keys/public.pem

Create TLS keys & certificates
------------------------------

Create CA key & certificate
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   openssl ecparam -name secp384r1 -genkey -out /tmp/netsec.key
   openssl req -x509 -new -nodes -sha256 -days 90 -key /tmp/netsec.key \
       -out /tmp/netsec.crt -subj '/CN=NetSec/C=GR/ST=Attiki/L=Athina/O=AUEB'

Create server key & CSR
^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   openssl ecparam -name secp384r1 -genkey -out /tmp/server.key
   openssl req -new -nodes -sha256 -key /tmp/server.key -out /tmp/server.csr \
       -subj '/CN=localhost/C=GR/ST=Attiki/L=Athina/O=AUEB/OU=MSCIS' \
       -addext 'subjectAltName=DNS:backend.localhost,DNS:frontend.localhost,IP:127.0.0.1'

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

Move files to the Apache directory
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo mkdir /etc/apache2/ssl
   sudo chmod 710 /etc/apache2/ssl
   sudo mv /tmp/server.{crt,key} /etc/apache2/ssl
   sudo mv /tmp/dhparams.pem /etc/apache2/ssl
   sudo chmod 600 /etc/apache2/ssl/server.key

Apache
------

.. code:: bash

   cd ..

Copy configuration
^^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo cp config/apache2.conf /etc/apache2/apache2.conf

Symlink directory
^^^^^^^^^^^^^^^^^

.. code:: bash

   sudo mkdir -p /var/www/html
   sudo ln -s "$PWD" /var/www/html/digidice

Start Apache
^^^^^^^^^^^^

.. code:: bash

   sudo systemctl start apache2

Start uWSGI
^^^^^^^^^^^

.. code:: bash

   sudo mkdir /var/run/www-data
   sudo uwsgi --xml "$PWD/config/uwsgi.xml"
