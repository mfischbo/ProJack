# ProJack #
ProJack is a small issue tracker and sprint planning tool providing a KANBAN style
Ticket Bord with swimlanes and drag and drop support.
The project started out as a pet project to evaluate some techniques like angularjs,
Apache CouchDB and elasticsearch. The idea behind using those technologies was
to write a software running completely without any middleware.


## Installation ##

### Prerequisites ###
1. A running CouchDB installation with Version 1.6. Can be downloaded
[here](https://couchdb.apache.org)

2. A running elasticsearch installation. ProJack was developed against version 1.7
but is using only a minimal set of the API and thus should be working with newer releases
as well. Elasticsearch can be retrieved from [here](https://www.elastic.co/)

### Installation ###
    git clone https://github.com/mfischbo/ProJack.git
    cd projack
    bower install

### Configuration of CouchDB and Elasticsearch ###
In order to access the API's of CouchDB and Elasticsearch one can use a proxy server
or directly access those. For the later one you will need to enable CORS support.

For CouchDB you can enable CORS by editing /etc/couchdb/default.ini

    [httpd]
    enable_cors = true

    [cors]
    credentials = true
    origins = * // you can adjust this to your needs

You might also want to add a admin user for CouchDB in order to login.
The Admin user can be added in /etc/couchdb/local.ini

    [admins]
    admin = mysecretpassword


For Elasticsearch you can use the following options in your elasticsearch.yml file

    http.cors.enabled: true
    http.cors.allow-credentials: true
    http.cors.allow-origin: /https?://localhost(:[0-9]+)?/

### Configuration of Projack ###
URLs to CouchDB and Elasticsearch can be configured in the file config.js which
contains information about how to set those values. After changing the URL's to
the correct values you need to install all design documents. For this point your
browser to

    http://localhost/projack/setup.html

and run the setup process.

## Running ##
At the moment projack javascript and html files should be served from a webserver.
It is planned to integrate a full build and a server which can be started from npm
in the near future.
