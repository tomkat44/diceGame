Vagrant.configure('2') do |config|
    config.vm.box = 'roboxes/debian11'

    config.vm.hostname = 'digidice'

    # config.vm.network :private_network, type: 'dhcp'

    config.vm.synced_folder '.', '/var/www/html/digidice',
        type: 'rsync', owner: 'www-data', group: 'www-data',
        rsync__exclude: ['.git*', 'README.rst', 'backend/.venv']

    config.vm.provider :virtualbox do |v|
        v.name = 'digidice'
        v.cpus = 2
        v.memory = 2048
        v.customize ['modifyvm', :id, '--clipboard-mode', 'bidirectional']
    end

    config.vm.provider :libvirt do |v|
      v.title = 'digidice'
      v.cpus = 2
      v.memory = 2048
      v.driver = 'kvm'
      v.video_type = 'qxl'
      v.graphics_type = 'spice'
    end

    config.vm.provision :shell, reboot: true, inline: <<-BASH
        # install dependencies
        export DEBIAN_FRONTEND=noninteractive
        apt-get update
        apt-get install -yq lxde-core lxdm fonts-noto-core chromium libnss3-tools
        apt-get install -yq apache2 python3{,-pip,-venv} mariadb-server libmariadb-dev

        # set up database
        systemctl enable --now mariadb
        mysqladmin -u root --password='' password c804a7de73e8ab92f2be
        mysql -u root --password=c804a7de73e8ab92f2be < /var/www/html/digidice/backend/initdb.sql

        # set up project
        pushd /var/www/html/digidice/backend
        python3 -mvenv .venv
        source .venv/bin/activate
        python3 -mpip install --no-cache --use-pep517 -e .[uwsgi]
        python3 manage.py migrate --no-input
        env DJANGO_SUPERUSER_PASSWORD=51703d629a775bd13ce3 python3 \
            manage.py createsuperuser --username admin --email 'webmaster@localhost' --no-input
        openssl genrsa -out keys/private.pem 4096
        openssl rsa -in keys/private.pem -pubout -out keys/public.pem
        chmod 400 keys/private.pem
        popd

        # create TLS certificates
        openssl ecparam -name secp384r1 -genkey -out /tmp/netsec.key
        openssl req -x509 -new -nodes -sha256 -days 90 -key /tmp/netsec.key \
            -out /tmp/netsec.crt -subj '/CN=NetSec/C=GR/ST=Attiki/L=Athina/O=AUEB'
        openssl ecparam -name secp384r1 -genkey -out /tmp/server.key
        openssl req -new -nodes -sha256 -key /tmp/server.key -out /tmp/server.csr \
            -subj '/CN=localhost/C=GR/ST=Attiki/L=Athina/O=AUEB/OU=MSCIS' \
            -addext 'subjectAltName=DNS:backend.localhost,DNS:frontend.localhost,IP:127.0.0.1'
        openssl x509 -req -sha256 -days 30 -CAcreateserial -CA /tmp/netsec.crt \
            -CAkey /tmp/netsec.key -in /tmp/server.csr -out /tmp/server.crt -extfile \
            <(printf 'subjectAltName=DNS:backend.localhost,DNS:frontend.localhost,IP:127.0.0.1')
        openssl dhparam -out /tmp/dhparams.pem 2048
        chmod 400 /tmp/{netsec,server}.key

        # store certificates
        mkdir /etc/apache2/ssl
        chmod 710 /etc/apache2/ssl
        mv /tmp/server.{crt,key} /etc/apache2/ssl
        mv /tmp/dhparams.pem /etc/apache2/ssl
        mv /tmp/netsec.key /etc/ssl/private
        mkdir -p /home/vagrant/.pki/nssdb
        certutil -A -t 'C,,' -n NetSec -d sql:/home/vagrant/.pki/nssdb -i /tmp/netsec.crt
        chown -R vagrant:vagrant /home/vagrant/.pki
        mv /tmp/netsec.crt /usr/local/share/ca-certificates
        update-ca-certificates

        # configure uWSGI
        echo 'd /var/run/uwsgi 0755 www-data www-data -' > /etc/tmpfiles.d/uwsgi.conf
        sed -i /var/www/html/digidice/config/uwsgi.xml -e '/daemonize/d'
        mv /var/www/html/digidice/config/uwsgi.service /etc/systemd/system
        systemctl enable uwsgi

        # configure Apache
        ln -s /usr/lib/apache2/modules /etc/apache2
        mv /etc/apache2/apache2.conf /etc/apache2/apache2.conf.bak
        mv /var/www/html/digidice/config/apache2.conf /etc/apache2
        chown root:root /etc/apache2/apache2.conf
        systemctl enable apache2
    BASH
end
