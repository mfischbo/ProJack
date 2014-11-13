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

ProJack.security.controller("UserCreateController", ['$scope', '$location', 'KT', 'SecurityService', function($scope, $location, KT, service) {
	
	$scope.user = service.newUser();
	
	// check if the current user is an admin on the current db
	service.isAdminUser().then(function(isAdmin) {
		if (isAdmin != true) {
			KT.alert("Sie haben keine Berechtigung einen neuen Benutzer anzulegen! Hinweis: Der aktuelle Benutzer ist nicht in der Admin Gruppe", 'warning');
			$location.path('/admin/users');
		}
	});
	
	$scope.createUser = function() {
		$scope.user.passwordConfirmation = undefined;
		
		service.createUser($scope.user).then(function(response) {
			if (response.data.ok) { 
				service.addUserAsMember($scope.user).then(function(isOk) {
					if (isOk.ok)
						KT.alert('Der Benutzer wurde erfolgreich angelegt');
					else
						KT.alert('Beim anlegen der Berechtigungen des Benutzers ist ein Problem aufgetreten');
				});
			} else {
				KT.alert('Beim anlegen des Benutzers ins ein Fehler aufgetreten', 'error');
			}
		});
	};
}]);

ProJack.security.controller("UserProfileController", ['$scope', 'SecurityService', function($scope, service) {
	
}]);