ProJack.app = angular.module("ProJack", 
		['ngRoute', 'Utils', 'SecurityModule', 'TemplateModule', 
		 'DashBoardModule', 'MileStonesModule', 'CustomersModule', 
		 'IssuesModule', 'MailModule', 'CalendarModule', 'FlashLightModule']);

ProJack.app.filter('numberFixedLen', function () {
    return function(a,b){
        return(1e4+a+"").slice(-b)
    }
});

ProJack.app.filter('secsToTime', function() {
	return function(secs) {
		
		if (typeof secs === 'string' && secs.indexOf(':') > -1)
			return secs;
		
		if (secs == 0)
			return '00:00';
	
		var isNeg = false;
		if (secs < 0) {
			isNeg = true;
			secs = secs * -1;
		}
		
		var hours = Math.floor(secs / 3600);
		var mins  = Math.floor((secs % 3600) / 60);
		if (hours < 10) hours = "0" + hours;
		if (mins  < 10) mins  = "0" + mins;
		var retval = hours + ":" + mins;
		if (isNeg)
			retval = '-' + retval;
		return retval;
	}
});

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
		
		// Application settings
		.when('/admin/settings', {
			controller : 'ApplicationSettingsController',
			templateUrl: './modules/application/views/settings.html'
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
		.when('/milestones/:id/analyze', {
			controller : 'MileStonesAnalyzeController',
			templateUrl : './modules/milestones/views/analyze.html'
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
		.when('/issues/customer/:cid/create', {
			controller : 'IssueCreateController',
			templateUrl : './modules/issues/views/create.html'
		})
		.when('/issues/customer/:cid/milestone/:mid/create', {
			controller : 'IssueCreateController',
			templateUrl : './modules/issues/views/create.html'
		})
		.when('/issues/:id/edit', {
			controller : 'IssueEditController',
			templateUrl : './modules/issues/views/edit.html'
		})
		.when('/issues/:id/modify', {
			controller : 'IssueModifyController',
			templateUrl : './modules/issues/views/modify.html'
		})
		.when('/issues/changelog', {
			controller : 'IssueChangelogController',
			templateUrl : './modules/issues/views/changelog.html'
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
            	
                // safety check: are we logged in?
            	if (!localStorage.getItem(ProJack.config.sessionKey))
            		window.location.href = "./login.html";
            	
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
                    window.location.href = "./login.html";
                return $q.reject(rejection);
            }
        };
	});
}]);