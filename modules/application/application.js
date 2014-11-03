ProJack.app = angular.module("ProJack", 
		['ngRoute', 'Utils', 'SecurityModule', 'TemplateModule', 
		 'DashBoardModule', 'MileStonesModule', 'CustomersModule', 
		 'IssuesModule', 'MailModule', 'CalendarModule']);

ProJack.app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
	
	$routeProvider
		.when('/', {
			controller : 'DashBoardController',
			templateUrl : './modules/dashboard/views/index.html'
		})
		
		// User Administration
		.when('/admin/users', {
			controller : 'UserIndexController',
			templateUrl : './modules/security/views/user-index.html'
		})
		.when('/admin/users/:id/edit', {
			controller : 'UserEditController',
			templateUrl : './modules/security/views/user-edit.html'
		})
		.when("/admin/users/create", {
			controller : 'UserCreateController',
			templateUrl : './modules/security/views/user-create.html'
		})
		.when("/admin/users/self", {
			controller : 'UserProfileController',
			templateUrl : './modules/security/views/user-profile.html'
		})
	
		
		// Template Administration
		.when('/admin/templates', {
			controller : 'TemplateIndexController',
			templateUrl : './modules/templates/views/index.html'
		})
	
		// Milestones
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
		
		// Customer Administration
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
		
		// Issues
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
		
		// Calendar Module
		.when('/calendar', {
			controller : 'CalendarIndexController',
			templateUrl : './modules/calendar/views/index.html'
		})
		
		// mails
		.when("/mails", {
			controller : 'MailboxIndexController',
			templateUrl : './modules/mails/views/index.html'
		})
		.otherwise({redirectTo : '/'});

	
	$httpProvider.defaults.useXDomain = true;
	$httpProvider.defaults.withCredentials = true;
	
	$httpProvider.interceptors.push(function($q) {
        return {
            'request' : function(config) {
                if (config.method == "PATCH")
                    config.headers['Content-Type'] = "application/json";

                return config;
            },

            'requestError' : function(rejection) {
                return $q.reject(rejection);
            },

            'response'      : function(response) {
                return response;
            },

            'responseError' : function(rejection) {
                if (rejection.status == 401)
                    window.location.href = "./login";
               
                /*
                if (rejection.status == 503)
                	KT.alert("Ein verwendeter Dienst ist derzeit nicht erreichbar", 'error');
                
                
                if (rejection.status == 405 || rejection.status == 415)
                    KT.alert("Leider ist ein Fehler aufgetreten", 'error');

                if (rejection.status == 403) {
                    var m = rejection.config.method;
                    if (m == "POST" || m == "PATCH" || m == "PUT" || m == "DELETE")
                        KT.alert("Sie haben nicht die notwendigen Rechte um diese Aktion durchzuf&uuml;hren", 'error');
                }

                if (rejection.status == 500) {
                    KT.alert("Ooops! Da ist leider etwas schief gelaufen", 'error');
                }

                // disable spinner
                KT.disableSpinner();
                */
                return $q.reject(rejection);
            }
        };
	});
}]);