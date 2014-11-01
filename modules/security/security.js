ProJack.security = angular.module("SecurityModule", ['Utils']);

ProJack.security.directive("userSelector", ['SecurityService', 'KT', function(service, KT) {

	return {
        restrict:   "A",
        scope : {
            'selectAs': '=selectAs',
        },
        template: '<div class="form-group">'
            + '<select data-ng-model="selectAs" data-ng-options="u.id as u.login for u in users" class="form-control">'
            + '<option value="" disabled><b>User</b></option>'
            + '</select>'
            + '</div>',
        link:   function(scope, element, attrs) {

        	service.getAllUserNames().then(function(data) {
        		scope.users = data;
        	});
        } 
    };
}]);