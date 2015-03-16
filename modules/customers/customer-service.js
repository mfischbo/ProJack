/**
 * Service that handles all actions regarding customer management
 */
ProJack.customers.service("CustomerService", ['$http', 'KT', function($http, KT) {

	return {
		/**
		 * Returns all customers
		 */
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
	
		/**
		 * Returns the customer by the specified id
		 */
		getCustomerById : function(id) {
			var p = $http.get(ProJack.config.dbUrl + "/" + id).then(function(response) {
				return response.data;
			});
			return p;
		},
	
		/**
		 * Creates a new customer and returns it on success
		 */
		createCustomer : function(customer) {
			var p = $http.post(ProJack.config.dbUrl, customer).then(function(response) {
				return response.data;
			});
			return p;
		},
	
		/**
		 * Updates the given customer and returns it
		 */
		updateCustomer : function(customer) {
			customer.dateModified = new Date().getTime();
			var p = $http.put(ProJack.config.dbUrl + "/" + customer._id, customer).then(function(response) {
				customer._rev = response.data.rev;
				return customer;
			});
			return p;
		},
		
		/**
		 * Deletes the customer
		 */
		deleteCustomer : function(customer) {
			var p = $http({
				method : 'DELETE',
				url    : ProJack.config.dbUrl + "/" + customer._id + "?rev=" + customer._rev
			});
			return p;
		},
	
		/**
		 * Returns a prototype for a new customer object
		 */
		newCustomer: function() {
			return {
				type : "customer",
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
				gitlabProject : undefined,
				contacts : []
			};
		},
	
		/**
		 * Returns a prototype for a new contact object
		 */
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
