ProJack.elasticsearch = angular.module('Elasticsearch', []);

ProJack.elasticsearch.service('ESService', ['$http', function($http) {
	
	return {
		index : function(index, document) {
			if (!document._id) 
				console.error("The specified document does not have a valid ID");
			$http.put(ProJack.config.esUrl + '/' + ProJack.config.esIndex + '/'+index+'/' + document._id, document)
				.then(function() {
					console.log('Did work');
				}, function() {
					console.log('Failed!');
				});
		},
		
		
		/**
		 * Takes a hashmap (or javascript object) and creates a query
		 * string to search for.
		 * @param type		The document type that should be queried
		 * @param criteria	Object containing the query parameters
		 * @param sort		The name of the field to sort the results after
		 * @param asc		If true sort is ascending, descending otherwise
		 * @param offset	Results offset
		 * @param size		Maximum amount of results beeing returned 
		 */
		query : function(type, criteria, sort, asc, offset, size) {
			
			var qstring = '?q=';
			var post = { 
					query : { 
						bool : { 
							must : [] 
						}
					}
			};
			if (sort) {
				post.sort = {};
				post.sort[sort] = { "order" : asc == true? "asc" : "desc" }
			}
			
			for (var i in criteria) {
				if (criteria[i] == -1 || criteria[i] == '')
					continue;
			
				if (typeof criteria[i] === 'string') {
					var x = { term : {}	};
					x.term[i] = criteria[i];
				}
				if (typeof criteria[i] === 'object' && Object.prototype.toString.call(criteria[i]) === '[object Array]') {
					var x = { terms : { tags : [] }};
					for (var q in criteria[i]) {
						var tmp = criteria[i][q].split(/ /);
						for (var s in tmp)
							x.terms.tags.push(tmp[s].toLowerCase());
					}
				}
				post.query.bool.must.push(x);
			}
			
			var from = offset || 0;
			var pageSize = size || 50;
			
			return $http.post(ProJack.config.esUrl + '/' + ProJack.config.esIndex + '/' + type +  '/_search?size='+pageSize+'&from='+from, post)
				.then(function(response) {
					var retval = [];
					for (var i in response.data.hits.hits)
						retval.push(response.data.hits.hits[i]._source);
					return retval;
				});
		}
	};
}]);