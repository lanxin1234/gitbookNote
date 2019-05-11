# Production Environment Application List

This document aims to explain the info about all applications, include location, feature,
log location,port,and how to control it(stop/start/restart).


|application|description|host|port|binary/source dir|log dir|start command|stop command|restart command|
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
|api-proxy|nginx api lb|api-proxy|9081|/etc/nginx/conf.d|/var/log/nginx|sudo service nginx start|sudo service nginx stop|sudo service nginx restart|
|api-ssl-proxy|nginx ssl api lb|api-proxy|9443|/etc/nginx/conf.d|/var/log/nginx|sudo service nginx start|sudo service nginx stop|sudo service nginx restart|
|gps-proxy|nginx gps lb|gps-proxy|9090|/etc/nginx/conf.d|/var/log/nginx|service nginx start|service nginx stop|service nginx restart|
|web|web service|apiserver3|9086|/opt/traffic/traffic-web|N/A|N/A|N/A|N/A|
|api1|api service|apiserver1|9081|/opt/traffic/traffic-api|/opt/traffic/traffic-api|pm2 start 0 1 2 3|pm2 stop 0 1 2 3|pm2 restart 0 1 2 3|
|api2|api service|apiserver2|9081|/opt/traffic/traffic-api|/opt/traffic/traffic-api|pm2 start all|pm2 stop all|pm2 restart all|
|api3|api service|apiserver3|9081|/opt/traffic/traffic-api|/opt/traffic/traffic-api|pm2 start all|pm2 stop all|pm2 restart all|
|gps|lbs|apiserver1|3000|/opt/traffic/gps-service|/opt/traffic/gps-service|pm2 start 4|pm2 stop 4|pm2 restart 4|
|thrift|support api to mongo|apiserver1|9090|/opt/traffic/gps-service|/opt/traffic/gps-service|pm2 start 4|pm2 stop 4|pm2 restart 4|
|listener|rabbit listener|apiserver2|N/A|/opt/traffic/traffic-worker/|/var/log/listener.log|sudo supervisorctl start listener|sudo supervisorctl stop listener|sudo supervisorctl restart listener|
|rewarder|point rewarder|apiserver2|N/A|/opt/traffic/traffic-worker/|/var/log/traffic/rewarder.log|sudo supervisorctl start rewarder|sudo supervisorctl stop rewarder|sudo supervisorctl restart rewarder|
|file-server|file server|apiserver3|9082|/etc/nginx/conf.d|/var/log/nginx/|service nginx start|service nginx stop|service nginx restart|
|pg-master|postgresql master(for write)|datacenter3|5433|N/A|N/A/|N/A|N/A|N/A|
|pg-slave1|postgresql slave(for read)|datacenter2|5434|N/A|N/A/|N/A|N/A|N/A|
|pg-slave2|postgresql slave(for read)|datacenter1|5435|N/A|N/A/|N/A|N/A|N/A|
|mongo-master|mongo slave(for write)|datacenter3|27017|N/A|N/A/|N/A|N/A|N/A|
|mongo-slave1|mongo slave(for write)|datacenter2|27017|N/A|N/A/|N/A|N/A|N/A|
|mongo-slave2|mongo slave(for write)|datacenter1|27017|N/A|N/A/|N/A|N/A|N/A|
|rabbit1|rabbitmq|datacenter3|5672|N/A|N/A/|N/A|N/A|N/A|
|rabbit2|rabbitmq|datacenter2|5672|N/A|N/A/|N/A|N/A|N/A|
|rabbit3|rabbitmq|datacenter1|5672|N/A|N/A/|N/A|N/A|N/A|
|memcached1|memcached|datacenter3|11212|N/A|N/A/|N/A|N/A|N/A|
|memcached2|memcached|datacenter2|11213|N/A|N/A/|N/A|N/A|N/A|
|memcached3|memcached|datacenter1|11214|N/A|N/A/|N/A|N/A|N/A|
|fabric|blockchain service|apiserver3|11081|N/A|N/A/|N/A|N/A|N/A|

## Upgrade Guide

### Package the components need to be upgraded.

First of all we have to know which components have new features. In general `traffic-api`, `gps-service`, `traffic-web` and `hyperledger` always include change sets.

After packaging, copy them to the production env. In my case, I'd like to put them on the `firstbox`, `tmp` dir.

### Update Database

Before we update services as traffic-api, gps-service, we need update database, otherwise the services maybe crash. The updating steps are as following:

- Create/Delete new column/table.

  You __must__ do it by `sequelize`.

- Insert prerequisite data.

  The sql file is in project `traffic-api`

### Update Services

- traffic-api

Update one by one.

- gps-service

Only one gps-service


- traffic-web

Only one traffic-web

- hyperledger
