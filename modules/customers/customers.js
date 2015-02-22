ProJack.customers = angular.module("CustomersModule", ['Utils']);
ProJack.customers.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/customers', {
            controller : 'CustomersIndexController',
            templateUrl : './modules/customers/views/index.html'
        })
        .when('/customers/create', {
            controller : 'CustomersCreateController',
            templateUrl : './modules/customers/views/create.html'
        })
        .when('/customers/:id/edit', {
            controller : 'CustomersEditController',
            templateUrl : './modules/customers/views/edit.html'
        });
}]);