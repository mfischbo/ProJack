ProJack.customers = angular.module("CustomersModule", ['Utils']);

ProJack.customers.controller("CustomersIndexController", ['$scope', 'CustomerService', 'KT',
    function($scope, service, KT) {
	
	service.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});
	
	$scope.deleteCustomer = function(customer) {
		service.deleteCustomer(customer).then(function(promise) {
			if (promise.status.indexOf("2") == 0) {
				KT.remove("_id", customer._id, $scope.customers);
			}
		});
	};
}]);

ProJack.customers.controller('CustomersCreateController', ['$scope', 'CustomerService', 'KT', '$location', 
                                                           function($scope, service, KT, $location) {
	
	$scope.customer = service.newCustomer();
	$scope.contact  = service.newContact();
	
	$scope.createContact = function() {
		$scope.contact = service.newContact();
	};
	
	$scope.addContact = function() {
		if ($scope.contact) {
			$scope.customer.contacts.push($scope.contact);
			$scope.contact = undefined;
		}
	};
	
	$scope.editContact = function(c) {
		$scope.contact = c;
	};

	$scope.unfocusContact = function() {
		$scope.contact = undefined;
	};
	
	$scope.removeContact = function(c) {
		KT.remove('id', c.id, $scope.customer.contacts);
		if ($scope.contact && $scope.contact.id == c.id) 
			$scope.contact = undefined;
	};
	
	$scope.saveCustomer = function() {
		service.createCustomer($scope.customer).then(function() {
			$location.path("/customers");
		});
	};
}]);

ProJack.customers.controller('CustomersEditController', ['$scope', '$routeParams', 'CustomerService', 'KT', 
                                                         function($scope, $routeParams, service, KT) {

	$scope.contact = undefined;
	
	service.getCustomerById($routeParams.id).then(function(data) {
		$scope.customer = data;
	});

	$scope.createContact = function() {
		$scope.contact = service.newContact();
	};
	
	$scope.addContact = function() {
		if ($scope.contact) {
			if (KT.indexOf('id', $scope.contact.id, $scope.customer.contacts) == -1) {
				$scope.customer.contacts.push($scope.contact);
			}
			$scope.contact = undefined;
		}
	};

	$scope.unfocusContact = function() {
		$scope.contact = undefined;
	};
	
	$scope.editContact = function(c) {
		$scope.contact = c;
	};
	
	$scope.removeContact = function(c) {
		KT.remove('id', c.id, $scope.customer.contacts);
		if ($scope.contact && $scope.contact.id == c.id) 
			$scope.contact = undefined;
	};
	
	
	$scope.saveCustomer = function() {
		service.updateCustomer($scope.customer);
	};
}]);