ProJack.reminder.service('ReminderService', ['$http', 'SecurityService', function($http, securityService) {

	return {
		
		newReminder : function() {
			return {
				type		: 'reminder',
				description : '',
				alertAt		: new Date().getTime(),
				alertTime	: '',
				userCreated : securityService.getCurrentUserName(),
			};
		},
		
		
		getAllActiveReminders : function() {
			var x = new Date();
			var startKey = '[1983,7,3,8,28]'; // hrhr
			var endKey   = '[' + x.getFullYear() + ',' + (x.getUTCMonth() + 1) + ',' + x.getUTCDate() + ',' + (x.getUTCHours() + 1) + ',' + (x.getMinutes()+1) + ']&inclusive_end=true';
			
			var that = this;
			return $http.get(ProJack.config.dbUrl + '/_design/timefeed/_list/userFilter/reminders?startkey=' + startKey + '&endkey=' + endKey)
				.then(function(response) {
					retval = {
							length : 0,
							issues : [],
							reminders : []
					};
					
					for (var i in response.data.rows) {
						var k = response.data.rows[i].key[response.data.rows[i].key.length -1];
						var v = response.data.rows[i].value;
						
						// user reminders
						if (k == 0) { 
							var r = that.getMomentForReminder(v);
							v.overdue = that.isOverdue(r, 1);
							retval.reminders.push(v);
						}
						
						// issues
						if (k == 3) {
							var r = moment(v.resolveUntil);
							v.overdue = that.isOverdue(r, 1);
							retval.issues.push(v);
						}
					}
					
					for (var k in retval) {
						if (Array.isArray(retval[k]))
							retval.length += retval[k].length;
					}
					return retval;
				});
		},
		
		createReminder : function(reminder) {
			return $http.post(ProJack.config.dbUrl, reminder).then(function(response) {
				return response.data;
			});
		},
		
		deleteReminder : function(reminder) {
			return $http({
				method  : 'DELETE',
				url		: ProJack.config.dbUrl + '/' + reminder._id + '?rev=' + reminder._rev
			});
		},
		
		getMomentForReminder : function(reminder) {
			var q = new Date(reminder.alertTime).getTime();
			return moment(reminder.alertAt + q);
		},
		
		isOverdue : function(m, dayOffset) {
			var q = new Date().getTime();
			return (q - m.valueOf() > 3600 * 1000 * 24 * dayOffset);
		}
	};
}]);