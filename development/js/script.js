window.addEventListener('DOMContentLoaded', _=>{
	'use strict';

	class Skills{
		constructor(){
			this.skills = {
				div: document.querySelector('.skills'),
				list: document.querySelector('.skills__list'),
				addEl: document.querySelector('.add-skill-element')
			}
			this.add = {
				div: document.querySelector('.add-skill'),
				input: document.querySelector('.add-skill__input')
			}
			this.edit = {
				div: document.querySelector('.edit-skill'),
				input: document.querySelector('.edit-skill__input')
			}
		}

		getSkills(){
			request.onsuccess = e=>{
				db = request.result;
				let store = db.transaction(['skills'], 'readwrite').objectStore('skills');
				this.updateSkills(store, this.drawSkills);
			};
		};

		drawSkills(){
			let keys = Object.keys(skillsClass.copy), fragment = new DocumentFragment();
			for(let i = 0, l = keys.length; l > i; i++){
				let key = keys[i];
				skillsClass.createSkillsLi(skillsClass.copy[key].name, key, fragment);
			}
			skillsClass.skills.list.appendChild(fragment);
		}

		updateSkills(store, callback){
			this.copy = {};
			store.openCursor().onsuccess = e=> {
				let cursor = e.target.result;
				if(cursor){
					this.copy[cursor.primaryKey] = cursor.value;
					cursor.continue();
				}else if(callback){
					callback();
				};
			};
		};

		showAddSkill(){
			headerText.textContent = 'ADD SKILL'
			this.add.input.value = "";
			history.pushState({el: 'addSkill'}, 'addSkill');
			hideShow(this.skills.div, this.add.div);
			focusElement(this.add.input);
		};

		addSkillToDB(){
			let name = this.add.input.value, newObj = {name, records:[], total: 0}, store = db.transaction(['skills'], 'readwrite').objectStore('skills'), req = store.put(newObj);
			req.onsuccess = _=>{
				this.updateSkills(store, function(){
					skillsClass.createSkillsLi(name, Object.keys(skillsClass.copy).slice(-1)[0])
				});
				history.back();
			};
			req.onerror = _=>{
				showError("Sorry we couldn't create the skill due to insufficient storage available. Try again after freeing up space.");
			};
		};

		createSkillsLi(name, key, parent = this.skills.list){
			let li = document.createElement('li');
			li.classList.add('skills__element');
			li.textContent = name;
			li.tabIndex = "1";
			li.setAttribute('key', key);
			createContainer(li, parent, 'skills__element-container')
		}

		showEditSkill(){
			headerText.textContent = 'EDIT SKILL'
			this.edit.input.value = this.currSkill.textContent;
			history.pushState({el: 'editSkill'}, 'editSkill');
			hideShow(this.skills.div, this.edit.div);
			focusElement(this.edit.input);
		}

		renameSkill(){
			let key = this.currSkillKey, name = this.edit.input.value, currObj = this.copy[key], store = db.transaction(['skills'], 'readwrite').objectStore('skills');
			currObj.name = name;
			let req = store.put(currObj, key)
			req.onsuccess = _=>{
				this.currSkill.textContent = name;
				history.back();
			};
			req.onerror = _=>{
				showError("Sorry we couldn't rename the skill due to insufficient storage available. Try again after freeing up space.");
			};
		}

		removeSkill(){
			let key = this.currSkillKey, store = db.transaction(['skills'], 'readwrite').objectStore('skills');
			delete this.copy[key];
			store.delete(key).onsuccess = _=>{
				this.currSkill.parentElement.remove();
				history.back();
			};
		}
		
	};

	class Records{
		constructor(){
			this.records = {
				div: document.querySelector('.records'),
				list: document.querySelector('.records__list'),
				addEl: document.querySelector('.add-record-element')
			}
			this.add = {
				div: document.querySelector('.add-record'),
				inputs: {
					h: document.querySelector('.add-record__input-hours'),
					m: document.querySelector('.add-record__input-minutes')
				}
			}
			this.edit = {
				div: document.querySelector('.edit-record'),
				inputs: {
					h: document.querySelector('.edit-record__input-hours'),
					m: document.querySelector('.edit-record__input-minutes')
				}
			}
			this.hInputs = [this.add.inputs.h, this.edit.inputs.h]
			this.mInputs = [this.add.inputs.m, this.edit.inputs.m]
			this.currText = [0, 0]
			this.watchInputs()
		}

		showRecords(){
			headerText.textContent = 'RECORDS'
			this.recordsArray = skillsClass.copy[this.currSkillKey].records
			history.pushState({el: 'records'}, 'records');
			hideShow(skillsClass.skills.div, this.records.div);
			focusElement(chartsClass.picker.w);
			this.drawRecords()
		}

		drawRecords(){
			removeTagButFirst(this.records.list, '.records__element')
			let fragment = new DocumentFragment(), today = fuckingParse(), lastFive = this.recordsArray.slice(-5).filter(el => today === el.date);
			for(let i = 0, l = lastFive.length; l > i; i++){
				let {date, h, m} = lastFive[i]
				this.createRecordsLi(`${h}h ${m}m`, fragment)
			}
			this.records.list.appendChild(fragment)
			this.drawWeek()
		}

		showAddRecord(){
			headerText.textContent = 'ADD RECORD'
			this.currObj = skillsClass.copy[this.currSkillKey]
			this.add.inputs.h.value = '';
			this.add.inputs.m.value = '';
			history.pushState({el: 'addRecord'}, 'addRecord');
			hideShow(this.records.div, this.add.div);
			focusElement(this.add.inputs.h);
		}

		addRecordToDB(){
			let store = db.transaction(['skills'], 'readwrite').objectStore('skills'), h = Number(this.add.inputs.h.value), m = Number(this.add.inputs.m.value)
			this.recordsArray.push({date: fuckingParse(), h, m})
			let req = store.put(skillsClass.copy[this.currSkillKey], this.currSkillKey)
			req.onsuccess = _=>{
				this.drawRecords()
				history.back();
			}
			req.onerror = _=>{
				showError("Sorry we couldn't add the record due to insufficient storage available. Try again after freeing up space.");
			};
		}

		createRecordsLi(text, parent = this.records.list){
			let li = document.createElement('li');
			li.classList.add('records__element');
			li.textContent = text;
			li.tabIndex = "1";
			createContainer(li, parent, 'records__element-container')
		}

		showEditRecord(){
			headerText.textContent = 'EDIT RECORD'
			this.currObj = skillsClass.copy[this.currSkillKey]
			this.edit.inputs.h.value = this.currText[0];
			this.edit.inputs.m.value = this.currText[1];
			history.pushState({el: 'editRecord'}, 'editRecord');
			hideShow(this.records.div, this.edit.div);
			focusElement(this.edit.inputs.h);
		}

		changeRecord(){
			let store = db.transaction(['skills'], 'readwrite').objectStore('skills'), h = Number(this.edit.inputs.h.value), m = Number(this.edit.inputs.m.value), currIndex = this.recordsArray.findIndex(el => el.date === fuckingParse() && el.h === this.currText[0] && el.m === this.currText[1])
			this.recordsArray[currIndex] = {date: fuckingParse(), h, m}
			let req = store.put(skillsClass.copy[this.currSkillKey], this.currSkillKey)
			req.onsuccess = _=>{
				this.el.textContent = `${h}h ${m}m`
				this.drawWeek()
				history.back();
			}
			req.onerror = _=>{
				showError("Sorry we couldn't change the record due to insufficient storage available. Try again after freeing up space.");
			};
		}

		removeRecord(){
			let store = db.transaction(['skills'], 'readwrite').objectStore('skills'), currIndex = this.recordsArray.findIndex(el => el.date === fuckingParse() && el.h === this.currText[0] && el.m === this.currText[1])
			this.recordsArray.splice(currIndex, 1)
			store.put(skillsClass.copy[this.currSkillKey], this.currSkillKey).onsuccess = _=>{
				this.drawRecords()
				history.back();
			};
		}

		watchInputs(){
			for(let l = this.hInputs.length; l--;){
				this.hInputs[l].addEventListener('keyup', e=>{limitInputs(this.hInputs[l], 23 - chartsClass.timeToday.h + recordsClass.currText[0])})
			}
			for(let l = this.mInputs.length; l--;){
				this.mInputs[l].addEventListener('keyup', e=>{limitInputs(this.mInputs[l], 59 - chartsClass.timeToday.m + recordsClass.currText[1])})
			}
		}

		drawWeek(){
			let d = new Date(), today = d.getDate(), todaysWeekDay = d.toLocaleDateString('en', {weekday: 'short'}), firstDay = fuckingParse(d.setDate(today - d.getDay())),
				days = {Sun: {h: 0, m: 0}, Mon: {h: 0, m: 0}, Tue: {h: 0, m: 0}, Wed: {h: 0, m: 0}, Thu: {h: 0, m: 0}, Fri: {h: 0, m: 0}, Sat: {h: 0, m: 0}},
				firstIndex = this.recordsArray.findIndex(el => el.date >= firstDay), sliced = firstIndex > -1 ? this.recordsArray.slice(firstIndex) : []
			for(let l = sliced.length; l--;){
				let element = sliced[l], dayName = new Date(element.date).toLocaleDateString('en', {weekday: 'short'})
				days[dayName].h += element.h
				days[dayName].m += element.m
			}
			chartsClass.timeToday = days[todaysWeekDay]
			chartsClass.vals = days
			chartsClass.drawProportions()
		}

		drawMonth(){
			let d = new Date(), month = d.getMonth(), year = d.getFullYear(), firstDay = fuckingParse(year, month, 1), firstDayCopy = firstDay,
				lastDay = fuckingParse(year, month + 1, 0), sections = {}, weeks = {},
				firstWeekDay = firstDay - (new Date(firstDay).getDay() * day), lastWeekDay = firstWeekDay + (6 * day)
			while(firstDayCopy <= lastDay){
				if(lastDay < lastWeekDay){
					lastWeekDay = lastDay
				}
				let weeksKey = new Date(firstDayCopy).toLocaleDateString('en', options) + '-' + new Date(lastWeekDay).toLocaleDateString('en', options)
				sections[lastWeekDay] = {}
				weeks[weeksKey] = {h: 0, m: 0}
				firstDayCopy = lastWeekDay + day
				lastWeekDay += 7 * day
			}
			let ArrToSend = [...this.recordsArray], sectionsKeys = Object.keys(sections), weeksKeys = Object.keys(weeks), firstIndex = ArrToSend.findIndex(el => el.date >= firstDay), sliced = firstIndex > -1 ? this.recordsArray.slice(firstIndex) : []
			for(let l = sliced.length; l--;){
				let element = sliced[l], keyIndex = sectionsKeys.findIndex(el => el >= element.date), key = weeksKeys[keyIndex]
				weeks[key].h += element.h
				weeks[key].m += element.m
			}
			chartsClass.vals = weeks
			chartsClass.drawProportions()
		}

		drawYear(){
			let d = new Date(), firstDay = fuckingParse(d.getFullYear(), 0, 1),
				months = {Jan: {h: 0, m: 0}, Feb: {h: 0, m: 0}, Mar: {h: 0, m: 0}, Apr: {h: 0, m: 0}, May: {h: 0, m: 0}, Jun: {h: 0, m: 0}, Jul: {h: 0, m: 0}, Aug: {h: 0, m: 0}, Sep: {h: 0, m: 0}, Oct: {h: 0, m: 0}, Nov: {h: 0, m: 0}, Dec: {h: 0, m: 0}},
				firstIndex = this.recordsArray.findIndex(el => el.date >= firstDay), sliced = firstIndex > -1 ? this.recordsArray.slice(firstIndex) : []
			for(let l = sliced.length; l--;){
				let element = sliced[l], monthName = new Date(element.date).toLocaleDateString('en', {month: 'short'})
				months[monthName].h += element.h
				months[monthName].m += element.m
			}
			chartsClass.vals = months
			chartsClass.drawProportions()
		}

		drawAllTime(){
			let all = {allTime: {h: 0, m: 0}}
			for(let l = this.recordsArray.length; l--;){
				let element = this.recordsArray[l]
				all.allTime.h += element.h
				all.allTime.m += element.m
			}
			chartsClass.vals = all
			chartsClass.drawProportions()
		}
	}

	class Chart{
		constructor(){
			this.picker = {
				div: recordsClass.records.list.querySelector('.records__chart-picker'),
				get w(){
					return this.div.querySelector('.records__chart-pick.records__chart-pick-week')
				},
				get m(){
					return this.div.querySelector('.records__chart-pick.records__chart-pick-month')
				},
				get y(){
					return this.div.querySelector('.records__chart-pick.records__chart-pick-year')
				},
				get a(){
					return this.div.querySelector('.records__chart-pick.records__chart-pick-all-time')
				}
			}
			this.c1 = {
				el: recordsClass.records.list.querySelector('.records__chart'),
				get ctx(){
					return this.el.getContext('2d')
				},
				w: window.innerWidth,
				get h(){
					return this.el.height
				}
			}
			this.c2 = {
				el: recordsClass.records.list.querySelector('.records__legend'),
				get ctx(){
					return this.el.getContext('2d')
				},
				w: this.c1.w,
				maxH: window.innerHeight - 58
			}
			this.c2.el.width = this.c1.el.width = this.c2.w
			this.colors = ['#488f31','#3d9c73','#63b179','#88c580','#aed987','#d6ec91','#ffff9d','#fee17e','#fcc267','#f7a258','#ef8250','#ee7c4f','#e4604e']
		}

		drawBlackCircle(){
			this.c1.ctx.strokeStyle = '#fff'
			this.c1.ctx.beginPath()
			this.c1.ctx.arc(this.c1.w / 2, 70, 60, 0, Math.PI * 2)
			this.c1.ctx.closePath()
			this.c1.ctx.stroke()
		}

		drawProportions(){
			let keys = Object.keys(this.vals), totalM = 0, totalH = 0, lastDegree = 0
			for(let l = keys.length; l--;){
				let key = keys[l]
				totalM += this.vals[key].m
				totalH += this.vals[key].h
			}
			let leftM = totalM % 60, leftH = totalH + Math.floor(totalM / 60), total = leftH + (leftM / 60), text = `Total Time: ${leftH}h, ${leftM}m`
			this.c1.ctx.clearRect(0, 0, this.c1.w, this.c1.h)
			this.c1.ctx.lineWidth = 10
			if(total > 0){
				for(let l = keys.length; l--;){
					let key = keys[l], currVal = this.vals[key], currLeftM = currVal.m % 60, currLeftH = currVal.h + Math.floor(currVal.m / 60), currTotal = currLeftH + (currLeftM / 60), to = lastDegree + (Math.PI * 2 * currTotal / total)
					this.c1.ctx.strokeStyle = this.colors[l]
					this.c1.ctx.beginPath()
					this.c1.ctx.arc(this.c1.w / 2, 70, 60, lastDegree, to)
					this.c1.ctx.stroke()
					lastDegree = to
				}
			}else{
				this.drawBlackCircle()
			}
			this.c1.ctx.fillStyle = '#fff'
			this.c1.ctx.fillText(text, this.c1.w / 2 - (this.c1.ctx.measureText(text).width / 2), 70+6)
			this.drawLegend()
		}

		drawLegend(){
			let keys = Object.keys(this.vals), length = keys.length, height = this.c2.maxH
			this.c2.ctx.clearRect(0, 0, this.c2.w, this.c2.h)
			this.c2.el.height = length > 8 && height < 200 ? (8*18) + 12 : (length*18) + 12
			this.c2.ctx.font = "12px Arial"
			for(let l = length; l--;){
				let key = keys[l], x = 10, y = (l*18) + 8, currVal = this.vals[key], currObj = this.vals[key], currLeftM = currVal.m % 60, currLeftH = currVal.h + Math.floor(currLeftM / 60)
				if((y + 15) > height && height < 200){
					x = 140
					y -= 144
				}
				this.c2.ctx.fillStyle = this.colors[l]
				this.c2.ctx.fillRect(x, y, 15, 15)
				this.c2.ctx.fillStyle = '#fff'
				this.c2.ctx.fillText(`${key}: ${currLeftH}h, ${currLeftM}m`, x + 20, y + 12)
			}
		}
	}

	class Softkeys{

		constructor(){
			this.leftSoftkey = document.querySelector('.softkey__left')
			this.centerSoftkey = document.querySelector('.softkey__center')
			this.rightSoftkey = document.querySelector('.softkey__right')
		}

		setSoftkeys(classes){
			switch(classes){
				case 'add-skill-element skills__element':
					this.changeSoftkeys('Info', 'SELECT', '')
				break;
				case 'skills__element':
					this.changeSoftkeys('Info', 'SELECT', 'Edit')
				break;
				case 'add-skill__input':
				case 'edit-skill__input':
				case 'add-record__input-hours':
				case 'add-record__input-minutes':
				case 'edit-record__input-hours':
				case 'edit-record__input-minutes':
					this.changeSoftkeys('Cancel', '', '')
				break;
				case 'add-skill__button add-skill__button-add':
				case 'add-skill__button add-skill__button-cancel':
				case 'edit-skill__button edit-skill__button-save':
				case 'edit-skill__button edit-skill__button-remove':
				case 'edit-skill__button edit-skill__button-cancel':
				case 'add-record add-record__button-add':
				case 'add-record add-record__button-edit':
				case 'edit-record__button edit-record__button-save':
				case 'edit-record__button edit-record__button-remove':
				case 'edit-record__button edit-record__button-cancel':
				case 'records__chart-pick records__chart-pick-week':
				case 'records__chart-pick records__chart-pick-month':
				case 'records__chart-pick records__chart-pick-year':
				case 'records__chart-pick records__chart-pick-all-time':
				case 'add-record-element records__element':
					this.changeSoftkeys('', 'SELECT', '')
				break;
				case 'records__chart':
				case 'records__legend':
				case 'info__text':
					this.changeSoftkeys('', '', '')
				break;
				case 'records__element':
				  this.changeSoftkeys('', '', 'Edit')
				break;
			}
		}

		left(classes){
			switch(classes){
				case 'add-skill__input':
				case 'edit-skill__input':
				case 'add-record__input-hours':
				case 'add-record__input-minutes':
				case 'edit-record__input-hours':
				case 'edit-record__input-minutes':
					history.back()
				break;
				case 'add-skill-element skills__element':
				case 'skills__element':
					showInfo()
				break;
			}
		}

		changeSoftkeys(left, center, right){
			this.leftSoftkey.textContent = left;
			this.centerSoftkey.textContent = center;
			this.rightSoftkey.textContent = right;
		};
	
		center(classes, el){
			switch(classes){
				case 'add-skill-element skills__element':
					skillsClass.showAddSkill()
				break;
				case 'add-skill__button add-skill__button-add':
					db?skillsClass.addSkillToDB():showError("Sorry, we couldn't access the database.");
				break;
				case 'add-skill__button add-skill__button-cancel':
				case 'edit-skill__button edit-skill__button-cancel':
				case 'add-record__button add-record__button-cancel':
				case 'edit-record__button edit-record__button-cancel':
					history.back();
				break;
				case 'edit-skill__button edit-skill__button-save':
					db?skillsClass.renameSkill():showError("Sorry, we couldn't access the database.");
				break;
				case 'edit-skill__button edit-skill__button-remove':
					db?skillsClass.removeSkill():showError("Sorry, we couldn't access the database.");
				break;
				case 'skills__element':
					recordsClass.currSkillKey = Number(el.getAttribute('key'))
					db?recordsClass.showRecords():showError("Sorry, we couldn't access the database.");
				break;
				case 'add-record-element records__element':
					recordsClass.showAddRecord()
				break;
				case 'add-record__button add-record__button-add':
					recordsClass.addRecordToDB();
				break;
				case 'edit-record__button edit-record__button-save':
					recordsClass.changeRecord();
				break;
				case 'edit-record__button edit-record__button-remove':
					recordsClass.removeRecord();
				break;
				case 'records__chart-pick records__chart-pick-week':
					recordsClass.drawWeek()
				break;
				case 'records__chart-pick records__chart-pick-month':
					recordsClass.drawMonth()
				break;
				case 'records__chart-pick records__chart-pick-year':
					recordsClass.drawYear()
				break;
				case 'records__chart-pick records__chart-pick-all-time':
					recordsClass.drawAllTime()
				break;
			}
		}

		right(classes, el){
			switch(classes){
				case 'skills__element':
					skillsClass.currSkillKey = Number(el.getAttribute('key'))
					skillsClass.currSkill = el
					skillsClass.showEditSkill();
				break;
				case 'records__element':
					recordsClass.el = el
					recordsClass.currText = el.textContent.slice(0,-1).split('h ').map(el=>Number(el))
					recordsClass.showEditRecord();
				break;
			}
		}
	}

	let request = window.indexedDB.open("1000HoursApp", 1),
	skillsClass = new Skills(),
	recordsClass = new Records(),
	softkeysClass = new Softkeys(),
	chartsClass = new Chart(),
	options = {year: 'numeric', month: 'numeric', day: 'numeric'},
	day = 86400000,
	headerText = document.querySelector('.header__text'),
	errorAlert = document.querySelector('.error'),
	info = document.querySelector('.info'),
	timeout,
	db
	;
	  
  	//if cant open DB
	request.onerror = e=>{
		showError("Sorry, we couldn't access the database.");
  	};

	//if app is loaded for the first time cteaye flashcards objectstore
	request.onupgradeneeded = e=>{
		let db = request.result, objectStore = db.createObjectStore('skills', {autoIncrement: true});
	};

	skillsClass.getSkills();
	
	window.addEventListener('popstate', _=>{
		let unhidden = document.querySelector('.visible'), classes = unhidden.className;
		switch(classes){
			//case 'skill-info visible':
			case 'add-skill visible':
			case 'edit-skill visible':
			case 'records visible':
			case 'info visible':
				headerText.textContent = 'SKILLS'
				hideShow(unhidden, skillsClass.skills.div);
				focusElement(skillsClass.skills.addEl);
			break;
			case 'add-record visible':
			case 'edit-record visible':
				headerText.textContent = 'RECORDS'
				recordsClass.currText[0] = 0
				recordsClass.currText[1] = 0
				hideShow(unhidden, recordsClass.records.div);
				focusElement(recordsClass.records.addEl);
			break;
		};
	});

	//if go back, fire hideAllExcept function with element
	//window.addEventListener('popstate', skillsClass);

	history.replaceState({el: 'skills'}, 'skills');

	//add keydown listener to document
	document.addEventListener('keydown', handleKeydown);

	//handle keyDowns and call appropriate function
	function handleKeydown(e){
		let element = e.target
		console.log(element.getAttribute('type'), element)
		switch(e.key){
			case 'ArrowUp':
				e.preventDefault();
				//pass the container
				navVertically(-1, element.parentElement);
				break;
			case 'ArrowDown':
				e.preventDefault();
				//pass the container
				navVertically(1, element.parentElement);
				break;
			case 'ArrowLeft':
				e.preventDefault();
				//pass the element
				navHorizontally(-1, element);
				break;
			case 'ArrowRight':
				e.preventDefault();
				//pass the element
				navHorizontally(1, element);
				break;
			case 'a':
			case 'SoftLeft':
				softkeysClass.left(element.className);
				break;
			case 'd':
			case 'SoftRight':
				softkeysClass.right(element.className, element);
				break;
			case 'Enter':
				softkeysClass.center(element.className, element);
				break;
			case 'Backspace':
				if(skillsClass.skills.div.classList.contains('hidden')){
					//if menu is not hidden exit app, else go back
					e.preventDefault();
				};
				if(element.tagName !== 'INPUT'){
					history.back();
				};
				break;
		};
	};

	function navHorizontally(n, el){
		let selectedElement;
		switch(n){
			case 1:
				selectedElement = el.nextElementSibling || el.parentElement.firstElementChild;
			break;
			case -1:
				selectedElement = el.previousElementSibling || el.parentElement.lastElementChild;
			break;
		};

		if(el !== selectedElement){
			focusElement(selectedElement);
		};
	};

	function navVertically(n, el){
		let selectedElement;
		switch(n){
			case 1:
				selectedElement = el.nextElementSibling || el.parentElement.firstElementChild;
			break;
			case -1:
				selectedElement = el.previousElementSibling || el.parentElement.lastElementChild;
			break;
		};

		if(el !== selectedElement){
			focusElement(selectedElement.firstElementChild);
		};
	};

	function focusElement(el){
		let former = document.activeElement, parent = el.parentElement;
		former.id = '';
		parent.focus();
		el.focus();
		el.id = 'focused';
		softkeysClass.setSoftkeys(el.className);
		parent.parentElement.scrollTop+=parent.getBoundingClientRect().y - 28
		if(el.tagName === 'INPUT'){
			let val = el.value
			el.value = ''
			el.value = val
		}
	}

	//shows error message and hides it after 3s
	function showError(message){
		if(message !== errorAlert.textContent)
			errorAlert.textContent = message;
		setTimeout(_=>{
			if(errorAlert.classList.contains('hidden')){
				errorAlert.classList.remove('hidden');
				timeout = setTimeout(_=>errorAlert.classList.add('hidden'), 3000);
			};
		},50)
	};

	function hideShow(toHide, toShow){
		toShow.classList.add('visible');
		toShow.classList.remove('hidden');
		toHide.classList.add('hidden');
		toHide.classList.remove('visible');
	}

	function createContainer(child, parent, classes){
		let div = document.createElement('div');
		div.className = classes;
		div.appendChild(child);
		div.setAttribute('tabIndex', 1)
		parent.appendChild(div);
	};

	function removeTagButFirst(parent, tag){
		let toRemove = parent.querySelectorAll(tag)
		for(let i = 1, l = toRemove.length; l > i; i++){
			toRemove[i].parentElement.remove()
		}
	}

	function fuckingParse(...date){
		return Date.parse(new Date(...date).toLocaleDateString('en', options))
	}

	function limitInputs(el, max){
		let val = Number(el.value)
		if(val > max){
			el.value = max
		}else if(val < 0){
			el.value = 0
		}
	}

	function showInfo(){
		headerText.textContent = "INFO";
		history.pushState({el: 'info'}, 'info');
		hideShow(skillsClass.skills.div, info);
		focusElement(info.firstElementChild.firstElementChild);
	}
	
	focusElement(skillsClass.skills.addEl)
});