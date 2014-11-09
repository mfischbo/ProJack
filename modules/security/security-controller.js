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

ProJack.security.controller("UserCreateController", ['$scope', 'KT', 'SecurityService', function($scope, KT, service) {
	
	$scope.user = service.newUser();
	
	$scope.createUser = function() {
		$scope.user.passwordConfirmation = undefined;
		
		service.createUser($scope.user).success(function(data) {
			service.addUserAsMember($scope.user).success(function() {
				KT.alert('Der Benutzer wurde erfolgreich angelegt');
			}).error(function() {
				KT.alert('Beim anlegen des Benutzers ist ein Fehler aufgetreten', 'error');
			});
		}).error(function() {
			KT.alert('Beim anlegen des Benutzers ist ein Fehler aufgetreten. Sind sie Admin?', 'error');
		});
	};
}]);

ProJack.security.controller("UserProfileController", ['$scope', 'SecurityService', function($scope, service) {
	
}]);