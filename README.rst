System & Network Security Assignment
====================================

Set up virtual environment
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: bash

   python -mvenv .venv # only the first time
   source .venv/bin/activate

Install project
^^^^^^^^^^^^^^^

.. code:: bash

   pip install -e .

Create JWT keys
^^^^^^^^^^^^^^^

.. code:: bash

   openssl genrsa -out keys/private-jwt.pem 4096
   openssl rsa -in keys/private-jwt.pem -pubout -out keys/public-jwt.pem
