var T = angular.module("Login", ['ngRoute', 'SecurityModule']);
T.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
	
	$routeProvider
		.when('/', {
			controller : "LoginController",
			templateUrl : "./modules/security/views/login.html"
		})
		.otherwise({redirectTo : "/" });
}]);


T.controller("LoginController", ['$scope', 'SecurityService', function($scope, securityService) {
	
	$scope.username = "";
	$scope.password = "";
	
	$scope.login = function() {
		console.log($scope.username + "    " + $scope.password);
		securityService.login($scope.username, $scope.password).then(function(data) {
			if (data.ok) {
				securityService.getCurrentSession().then(function(data) {
					sessionStorage.setItem("__proJack_session", JSON.stringify(data.userCtx));
					window.location.href = "/projack/";
				});
			}
		});
	};
}])