ProJack.security.controller("UserIndexController", ['$scope', 'SecurityService', function($scope, service) {
	
	service.getAllUserNames().then(function(data) {
		$scope.users = data;
	});
}]);

ProJack.security.controller("UserEditController", ['$scope', '$routeParams', 'SecurityService', function($scope, $params, service) {
	
	service.getUserById($params.id).then(function(data) {
		$scope.user = data;
	});
	
	$scope.updateUser = function() {
		service.updateUser($scope.user);
	};
}]);

ProJack.security.controller("UserCreateController", ['$scope', 'SecurityService', function($scope, service) {
	
	$scope.user = service.newUser();
	
	$scope.createUser = function() {
		service.createUser($scope.user).then(function(data) {
			// add the user to the list of members for this db
			service.addUserAsMember($scope.user);
		});
	};
}]);

ProJack.security.controller("UserProfileController", ['$scope', 'SecurityService', function($scope, service) {
	
}]);