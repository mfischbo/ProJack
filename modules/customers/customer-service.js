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
