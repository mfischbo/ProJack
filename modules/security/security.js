ProJack.security = angular.module("SecurityModule", ['Utils']);
ProJack.security.config(['$routeProvider', function($routeProvider) {

    $routeProvider
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
        });
}]);


ProJack.security.directive("userSelector", ['SecurityService', 'KT', function(service, KT) {

	return {
        restrict:   "A",
        scope : {
            'selectAs': '=selectAs',
        },
        template: '<div class="form-group">'
            + '<select data-ng-model="selectAs" data-ng-options="u.id as u.login for u in users" class="form-control">'
            + '<option value=""><b>Nobody</b></option>'
            + '</select>'
            + '</div>',
        link:   function(scope, element, attrs) {

        	service.getAllUserNames().then(function(data) {
        		scope.users = data;
        	});
        } 
    };
}]);