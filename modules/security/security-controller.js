/**
 * Controller to list all users
 */
ProJack.security.controller("UserIndexController", ['$scope', 'SecurityService', 'KT', function($scope, service, KT) {

	service.getCurrentUser().then(function(user) {
		$scope.currentUser = user;
		service.getAllUsers().then(function(users) {
			$scope.users = users;
			var x = KT.find('_id', $scope.currentUser._id, users);
			if (x.roles.indexOf('admin') > -1) {
				$scope.hasCreatePermission = true;
			}
		});
	});
}]);


/**
 * Controller to edit a certain user
 */
ProJack.security.controller("UserEditController", ['$scope', '$routeParams', 'SecurityService', 'KT', function($scope, $params, service, KT) {
	
	service.getUserById($params.id).then(function(data) {
		$scope.user = data;
	});
	
	$scope.updateUser = function() {
		service.updateUser($scope.user).then(function(user) {
			KT.alert('Der Benutzer wurde erfolgreich aktualisiert');
			$scope.user = user;
		});
	};
}]);


/**
 * Controller to create a new user
 */
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

ProJack.security.controller("UserProfileController", ['$scope', 'KT', 'SecurityService', function($scope, KT, service) {

	$scope.mode    = 'list';
	
	service.getCurrentUser().then(function(user) {
		$scope.user = user;
	});
	
	$scope.saveUser = function() {
		service.updateUser($scope.user).then(function(data) {
			KT.alert('Alle Daten wurden aktualisiert!');
		});
	};

	$scope.cancelCreate = function() {
		$scope.account = undefined;
		$scope.mode    = 'list';
	};
}]);