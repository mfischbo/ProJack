var T = angular.module("Login", ['ngRoute', 'SecurityModule']);
T.config(['$routeProvider', function($routeProvider) {
	
	$routeProvider
		.when('/', {
			controller : "LoginController",
			templateUrl : "./modules/security/views/login.html"
		})
		.when("/logout", {
			controller : "LogoutController",
			templateUrl : "./modules/security/views/login.html"
		})
		.otherwise({redirectTo : "/" });
}]);


T.controller("LoginController", ['$scope', 'SecurityService', function($scope, securityService) {
	
	$scope.username = "";
	$scope.password = "";
	
	$scope.login = function() {
		securityService.login($scope.username, $scope.password).then(function(data) {
			if (data.ok) {
				window.location.href = ProJack.config.appUrl;
			}
		});
	};
}]);

T.controller("LogoutController", ['$scope', 'SecurityService', function($scope, service) {
	service.logout().then(function() {
		localStorage.removeItem(ProJack.config.sessionKey);
		window.location.href = ProJack.config.appUrl + "/login.html";
	});
}]);