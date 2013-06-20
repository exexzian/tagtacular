/* ===================================================
 * tagtacular.js v1.0
 * A jQuery library for tags management.
 * http://gototech.com/tagtacular
 * ===================================================
 * Copyright 2013 Eric W. Burns
 *
 * Licensed under the Mozilla Public License, Version 2.0 You may not use this work except in compliance with the License.
 *
 * http://www.mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * See online documentation for complete instructions. Requires jquery.js and jqueryui.js.
 * =================================================== */

"use strict";

(function($){

	$.fn.tagtacular = function(command, modifier) {

		var toplevel = this;
		var entityTags = [];
		var allTags = [];
		var mode = 'edit';
		var ready = false;
		var rememberTag = '';

		///////////////////////
		/// Core Functions ///
		/////////////////////

		var addTag = function(tag) {
			tag = $.trim(tag);
			var result = settings.validate(tag);
			if (result === true) {
				if (!entityHasTag(tag)) {
					entityTags.push(tag);
					if (settings.configSortTags) {
						entityTags = settings.sort(entityTags);
					}
					settings.commitAddTag(tag);
					drawTagList();
					drawEditTray();
					settings.messageAddTagSuccess && settings.flashSuccess(settings.messageAddTagSuccess, 'addTag', tag);
				} else {
					settings.messageAddTagAlreadyExists && settings.flashWarning(settings.messageAddTagAlreadyExists, 'addTag', tag);
				}
			} else {
				result && settings.flashFailure(result, 'addTag', tag);
			}
			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
		}

	 	var drawEditTray = function() {
	 		if (mode == 'edit') {
	 			settings.drawEditTrayEdit();
	 		} else if (mode == 'view') {
	 			settings.drawEditTrayView();
	 		}	 		
	 	}

	 	var drawTagList = function() {
			entityTags = sortList(entityTags);

	 		if (mode == 'edit') {
	 			settings.drawTagListEdit();
	 		} else if (mode == 'view') {
	 			settings.drawTagListView();
	 		}
	 	}

		var entityHasTag = function(tag) {
			return tagInList(tag, entityTags);
		}

		var getAutocompleteTags = function(tag) {
			if (settings.configAutocompletePrune) {
				var diff = $.grep(allTags,function(val) {return $.inArray(val, entityTags) < 0});
				return diff;
			} else {
				return allTags;
			}
		}

		var removeTag = function(tag) {
			entityTags = $.grep(entityTags, function(value) {
				if (settings.configCaseInsensitive) {
					return value.toUpperCase() != tag.toUpperCase();
				} else {
					return value != tag;
				}
			});
			settings.commitRemoveTag(tag);
	 		drawTagList();
	 		drawEditTray();
			settings.messageRemoveTagSuccess && settings.flashSuccess(settings.messageRemoveTagSuccess, 'removeTag', tag);	 		
			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
	 	}

	 	var sortList = function(list) {
	 		if (settings.configSortTags) {
	 			list = settings.sort(list);
	 		}
	 		return list;
	 	}

		var systemHasTag = function(tag) {
			return tagInList(tag, systemTags);
		}

		/////////////////////////
		/// Helper Functions ///
		///////////////////////

		var caseInsensitiveSort = function(list) {
			list.sort(function(a,b) {
				a = a.toLowerCase();
				b = b.toLowerCase();
				if (a == b) {
					 return 0;
				}
				if (a > b) {
					return 1;
				}
				return -1;
			});

			return list;	
		}

		var tagInList = function(tag, list) {
			var match = $.grep(list, function(value) {
				if (settings.configCaseInsensitive) {
					return value.toUpperCase() == tag.toUpperCase();
				} else {
					return value == tag;
				}
			});
			return match.length > 0;
		}

		//////////////////////////
		/// Default Functions ///
		////////////////////////

		var defaultDrawLayout = function() {
			if (!settings.configAllowedToEdit) {
				mode = 'view';
			}
			toplevel.html('<div class="tagtacular_tag_tray"></div><div class="tagtacular_edit_tray"></div>');
			drawTagList();
			drawEditTray();
		}

		var defaultSelectOption = function(selection) {
			result = addTag(selection);
			if (result !== true) {
				request('flashFailure', selection, 'addTag', result);
			}
		}

		var defaultDrawEditTrayEdit = function() {
			var html = '<input class="tagtacular_add_input" value="'+rememberTag+'" />';
			if (settings.configShowAddButton) {
				html += '<button class="tagtacular_add_button">'+settings.configAddButtonText+'</button>'
			}
			if (settings.configShowSwitchButton) {
				html += '<button class="tagtacular_switch_button">'+settings.configSwitchButtonTextInEdit+'</button>'
			}
			toplevel.find('.tagtacular_edit_tray').html(html);
			if (settings.configShowAddButton) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_add_button').bind('click', function() {
					var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					addTag(tagText);
				});
			}

			if (settings.configShowSwitchButton) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_switch_button').bind('click', function() {
					var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					if (settings.configAddOnSwitch && tagText.length >= 1) {
						addTag(tagText);
					}
					rememberTag = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					mode = 'view';
					drawTagList();
					drawEditTray();
				});
			}

			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').bind('keypress', function(e) {
				if ($.inArray(e.which, settings.configDelimiters) != -1) {
					e.preventDefault();
					var tagText = toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').val();
					addTag(tagText);					
				}
			});

			if (settings.configAutocomplete) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').autocomplete({
					source: getAutocompleteTags(),
					select: function( event, ui ) {
						addTag(ui.item.value);
					}
				});
			}

			toplevel.find('.tagtacular_edit_tray .tagtacular_add_input').focus();
		}

		var defaultDrawEditTrayView = function() {
			var html = '';
			if (settings.configShowSwitchButton && settings.configAllowedToEdit) {
				html += '<button class="tagtacular_switch_button">'+settings.configSwitchButtonTextInView+'</button>'
			}
			toplevel.find('.tagtacular_edit_tray').html(html);

			if (settings.configShowSwitchButton && settings.configAllowedToEdit) {
				toplevel.find('.tagtacular_edit_tray .tagtacular_switch_button').bind('click', function() {
					mode = 'edit';
					drawTagList();
					drawEditTray();
					rememberTag = '';
				});
			}
		}

		var defaultDrawTagListEdit = function() {
			var tags = [];
			$.each(entityTags, function(key, value) {
				tags.push('<span class="tagtacular_tag"><span class="tagtacular_value">'+value+'</span>&nbsp;<a class="tagtacular_delete" href="#">'+settings.configDeleteSymbol+'</a><span class="tagtacular_delim">'+settings.configTagSeperator+'</span></span>');
			});
			var html = tags.join('');
			toplevel.find('.tagtacular_tag_tray').html(html);
			toplevel.find('.tagtacular_tag_tray .tagtacular_tag').last().find('.tagtacular_delim').remove();

			toplevel.find('.tagtacular_tag_tray .tagtacular_delete').bind('click', function(e) {
				e.preventDefault();
				var tag = $(this).closest('.tagtacular_tag');
				var tagText = tag.find('.tagtacular_value').text();
				tag.remove()
				removeTag(tagText);
			});

		}

		var defaultDrawTagListView = function() {
			var tags = [];
			$.each(entityTags, function(key, value) {
				tags.push('<span class="tag"><span class="value">'+value+'</span></span>');
			});
			var html = tags.join(settings.configTagSeperator);
			toplevel.find('.tagtacular_tag_tray').html(html);
		}

		var defaultFlashFailure = function(message) {
			alert(message);
		}

		var defaultFlashWarning = function(message) {
			alert(message);
		}

		var defaultValidate = function(tag) {
			if (tag.length < settings.configMinimumTagLength) {
				return 'tag too short: minimum length is ' + settings.configMinimumTagLength;
			}
			if (tag.length > settings.configMaximumTagLength) {
				return 'tag too long: maximum length is ' + settings.configMaximumTagLength;
			}
			var pattern = /^[0-9A-Za-z_\- ]+$/;
			if (!pattern.test(tag)) {
				return 'illegal characters: tag names can only include letters, numbers, underscores, hyphens, and spaces';
			}

			return true;
		}

		var doNothing = function(param) {
			// do nothing
			return param;
		}

		var stricterValidate = function(tag) {
			if (tag.length < settings.configMinimumTagLength) {
				return 'tag too short: minimum length is ' + settings.configMinimumTagLength;
			}
			if (tag.length > settings.configMaximumTagLength) {
				return 'tag too long: maximum length is ' + settings.configMaximumTagLength;
			}

			var pattern = /^[0-9A-Za-z_\-]+$/;
			if (!pattern.test(tag)) {
				return 'illegal characters: tag names can only include letters, numbers, underscores, and hyphens';
			}

			return true;
		}

		///////////////////////////////////
		/// Setting and Initialization ///
		/////////////////////////////////

		var settings = {
			configAddOnSwitch: true,
			configAddButtonText: 'Add',
			configAllowedToEdit: true,
			configAllowedToDefineNewTag: true,
			configAutocomplete: true,
			configAutocompletePrune: true,
			configCaseInsensitive: true,
			configDeleteSymbol: 'X',
			configDelimiters: [13,44],
			configMinimumTagLength: 1,
			configMaximumTagLength: 32,
			configShowAddButton: true,
			configShowSwitchButton: true,
			configSortTags: true,
			configStartingMode: 'edit',
			configSwitchButtonTextInEdit: 'Done',
			configSwitchButtonTextInView: 'Edit',
			configTagSeperator: ',&nbsp;',
			dataEntityTags: [],
			dataSystemTags: [],
			commitAddTag: doNothing,
			commitRemoveTag: doNothing,
			drawLayout: defaultDrawLayout,
			drawEditTrayEdit: defaultDrawEditTrayEdit,
			drawEditTrayView: defaultDrawEditTrayView,
			drawTagListEdit: defaultDrawTagListEdit,
			drawTagListView: defaultDrawTagListView,
			flashFailure: defaultFlashFailure,
			flashWarning: defaultFlashWarning,
			flashSuccess: doNothing,
			messageAddTagSuccess: 'tag added',
			messageAddTagAlreadyExists: 'tag is already assigned',
			messageRemoveTagSuccess: 'tag removed',
			selectOption: defaultSelectOption,
			sort: caseInsensitiveSort,
			validate: defaultValidate,
		};

		if (command == 'init') {
			modifier = modifier || {};
			$.each(modifier, function(key, value) {
				settings[key] = value;
			});

			entityTags = sortList(settings.dataEntityTags);
			allTags = sortList($.unique(settings.dataSystemTags.concat(entityTags)));
			mode = settings.configStartingMode;

			settings.drawLayout();
		} else if (command == 'addTag') {
			if ($.type(modifier) === 'string') {
				addTag(modifier);
			}
		} else if (command == 'removeTag') {
			if ($.type(modifier) === 'string') {
				removeTag(modifier);
			}
		}

	}

})(jQuery);