ProJack.reminder.service('ReminderService', ['$http', 'SecurityService', function($http, securityService) {

	return {
		
		newReminder : function() {
			return {
				type		: 'reminder',
				description : '',
				alertAt		: new Date(),
				alertTime	: '',
				deleted		: false
			}
		},
		
		
		getAllActiveReminders : function() {
			var x = new Date();
			var startKey = '[1983,7,3,8,28]'; // hrhr
			var endKey   = '[' + x.getFullYear() + ',' + (x.getUTCMonth() + 1) + ',' + x.getUTCDate() + ',' + (x.getUTCHours() + 1) + ',' + x.getUTCMinutes() + ']';
			
			var that = this;
			return $http.get(ProJack.config.dbUrl + '/_design/timefeed/_view/reminders?startkey=' + startKey + '&endkey=' + endKey)
				.then(function(response) {
					retval = {
							length : 0,
							milestoneReleases : [],
							milestoneSpecsDone : [],
							issues : [],
							reminders : []
					};
					
					var currentUser = 'org.couchdb.user:' + securityService.getCurrentUserName();
					
					for (var i in response.data.rows) {
						var k = response.data.rows[i].key[response.data.rows[i].key.length -1];
						var v = response.data.rows[i].value;
						
						// user reminders
						if (k == 0) { 
							var r = that.getMomentForReminder(v);
							v.overdue = that.isOverdue(r, 1);
							retval.reminders.push(v);
						}
						
						// milestone releases
						if (k == 1) {
							var r = moment(v.plannedReleaseDate);
							v.overdue = that.isOverdue(r, 1);
							retval.milestoneReleases.push(v);
						}
						
						// milestone specs finished
						if (k == 2) {
							var r = moment(v.plannedCompletionDate);
							v.overdue = that.isOverdue(r, 1);
							retval.milestoneSpecsDone.push(v);
						}
						
						// issues
						if (k == 3 && v.assignedTo !== undefined && v.assignedTo == currentUser) {
							var r = moment(v.resolveUntil);
							v.overdue = that.isOverdue(r, 1);
							retval.issues.push(v);
						}
					}
					
					for (var k in retval) {
						if (Array.isArray(retval[k]))
							retval.length += retval[k].length;
					}
					console.debug(retval);
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
			var d = reminder.alertAt.split('T')[0];
			var t = reminder.alertTime.split('T')[1];
			return moment(d + 'T' + t);
		},
		
		isOverdue : function(m, dayOffset) {
			var q = new Date().getTime();
			return (q - m.valueOf() > 3600 * 1000 * 24 * dayOffset)
		}
	};
}]);