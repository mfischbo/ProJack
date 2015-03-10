ProJack.app = angular.module("ProJack", 
		['ngRoute', 'Utils', 'SecurityModule', 'TemplateModule', 
		 'DashBoardModule', 'MileStonesModule', 'CustomersModule', 
		 'IssuesModule', 'MailModule', 'CalendarModule', 'FlashLightModule', 'SprintModule']);

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
		.when('/admin/settings', {
			controller : 'ApplicationSettingsController',
			templateUrl: './modules/application/views/settings.html'
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