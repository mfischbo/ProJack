ProJack.customers = angular.module("CustomersModule", ['Utils']);

ProJack.customers.service("CustomerService", ['$http', 'KT', function($http, KT) {

	return {
		getAllCustomers : function() {
			var p = $http.get(ProJack.config.dbUrl + "/_design/customers/_view/index").then(function(response) {
				var retval = [];
				for (var i in response.data.rows) {
					retval.push(response.data.rows[i].value);
				}
				return retval;
			});
			return p;
		},
		
		getCustomerById : function(id) {
			var p = $http.get(ProJack.config.dbUrl + "/" + id).then(function(response) {
				return response.data;
			});
			return p;
		},
		
		createCustomer : function(customer) {
			var p = $http.post(ProJack.config.dbUrl, customer).then(function(response) {
				return response.data;
			});
			return p;
		},
		
		updateCustomer : function(customer) {
			customer.dateModified = new Date().getTime();
			var p = $http.put(ProJack.config.dbUrl + "/" + customer._id, customer).then(function(response) {
				return response.data;
			});
			return p;
		},
		
		deleteCustomer : function(customer) {
			var p = $http({
				method : 'DELETE',
				url    : ProJack.config.dbUrl + "/" + customer._id + "?rev=" + customer._rev
			});
			return p;
		},
		
		newCustomer: function() {
			return {
				_type : "customer",
				dateCreated : new Date().getTime(),
				dateModified : new Date().getTime(),
				name : "",
				description : "",
				address : {
					street : "",
					zipcode : "",
					city : "",
					country : "DE"
				},
				contacts : []
			};
		},
		
		newContact : function() {
			return {
				id			: KT.UUID(),
				gender		: "M",
				firstName 	: "",
				lastName  	: "",
				phone	  	: "",
				email	  	: ""
			};
		}
	};
}]);

ProJack.customers.controller("CustomersIndexController", ['$scope', 'CustomerService', 'KT',
    function($scope, service, KT) {
	
	service.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});
	
	$scope.deleteCustomer = function(customer) {
		service.deleteCustomer(customer).then(function(promise) {
			if (promise.status == "200") {
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