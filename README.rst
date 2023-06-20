System & Network Security Assignment
====================================

Backend
^^^^^^^

.. code:: bash

   cd backend

Set up MySQL database
^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   mysql -u root -p < initdb.sql

Set up virtual environment
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: bash

   python -mvenv .venv
   source .venv/bin/activate

Install project
~~~~~~~~~~~~~~~

.. code:: bash

   pip install -e .
   python manage.py migrate
   python manage.py createsuperuser --username admin

Create JWT keys
~~~~~~~~~~~~~~~

.. code:: bash

   openssl genrsa -out keys/private.pem 4096
   openssl rsa -in keys/private.pem -pubout -out keys/public.pem
