ProJack.app = angular.module("ProJack", 
		['ngRoute', 'ang-drag-drop', 'Utils', 'SecurityModule', 
		 'DashBoardModule', 'ProjectsModule', 
		 'IssuesModule', 'FlashLightModule', 'SprintModule', 'GitlabModule', 'Elasticsearch', 'infinite-scroll']);

ProJack.app.filter('numberFixedLen', function () {
    return function(a,b){
        return(1e4+a+"").slice(-b);
    };
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
		
		if (isNaN(hours) || isNaN(mins)) {
			return '--:--';
		}
		var retval = hours + ":" + mins;
		if (isNeg)
			retval = '-' + retval;
		return retval;
	};
});

ProJack.app.filter('userName', function() {
	return function(username) {
		
		var retval = username;
		if (retval.indexOf('org.couchdb.user:') == 0) {
			return retval.replace('org.couchdb.user:', '');
		}
		return retval;
	};
});

/**
 * static-include directive is useful when a template should be included without creating a new scope.
 * This is a workaround for using ng-model="$parent.item" when using a directive with isolated scope
 * from within an included template.
 * 
 *  Usage:
 *  <div static-include="{path-to-template.html}"></div>
 */
ProJack.app.directive('staticInclude', ['$http', '$templateCache', '$compile', function($http, $templateCache, $compile) {

	return function(scope, element, attrs) {
		var path = attrs.staticInclude;
		$http.get(path, {cache : $templateCache}).success(function(response) {
			var contents = element.html(response).contents();
			$compile(contents)(scope);
		});
	}
}]);

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