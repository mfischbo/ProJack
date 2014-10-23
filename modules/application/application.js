var app = angular.module("ProJack", ['ngRoute', 'DashBoardModule', 'MileStonesModule', 'CustomersModule', 'IssuesModule']);
app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
	
	$routeProvider
		.when('/', {
			controller : 'DashBoardController',
			templateUrl : './modules/dashboard/views/index.html'
		})
		.when('/milestones', {
			controller : 'MileStonesController',
			templateUrl : './modules/milestones/views/index.html'
		})
		.when('/milestones/create', {
			controller : 'MileStonesCreateController',
			templateUrl : './modules/milestones/views/create.html'
		})
		.when('/milestones/:id/edit', {
			controller : 'MileStonesEditController',
			templateUrl : './modules/milestones/views/edit.html'
		})
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
		})
		.when('/issues', {
			controller : 'IssueIndexController',
			templateUrl : './modules/issues/views/index.html'
		})
		.when('/issues/create', {
			controller : 'IssueCreateController',
			templateUrl : './modules/issues/views/create.html'
		})
		.when('/issues/:id/edit', {
			controller : 'IssueEditController',
			templateUrl : './modules/issues/views/edit.html'
		})
		.otherwise({redirectTo : '/'});

	
	$httpProvider.defaults.useXDomain = true;
	$httpProvider.defaults.withCredentials = true;
}]);