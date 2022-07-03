const fuzz = require('fuzzball');
const readline = require('readline-sync');

const types = ['string', 'date', 'number', 'email'];
const schema = {
	'id': {
		'type': 'number',
		'required': true
	},
	'first_name': {
		'type': 'string',
		'required': true
	},
	'last_name': {
		'type': 'string',
		'required': true
	},
	'date_of_birth': {
		'type': 'date',
		'required': false
	},
	'class_year': {
		'type': 'number',
		'required': false
	},
	'email_field': {
		'type': 'email',
		'required': true
	}
}

let profiles = {
	1: { id: 1, email_field: 'knowkanhai@gmail.com', first_name: 'Kanhai', last_name: 'Shah', class_year: 'None', date_of_birth: 'None'},
	2: { id: 2, email_field: 'knowkanhai+donotcompare@gmail.com', first_name: 'Kanhai1', last_name: 'Shah', class_year: 2012, date_of_birth: '1990-10-11'},
	3: { id: 3, email_field: 'knowkanhai2@gmail.com', first_name: 'Kanhai1', last_name: 'Shah Rukh khan', class_year: 2013, date_of_birth: 'None'}
};

let new_profile_id = 1;

const addField = (type, is_required, field) => {
	schema[field] = {
		'type': type,
		'required': is_required
	}
}

const deleteField = (field) => {
	schema[field] = undefined;
}

const createProfile = () => {

}

function remove(array, item) {
	var index = array.indexOf(item);
	if (index !== -1) {
		array.splice(index, 1);
	}
}	

getFLE = (profile) => {
	return profile.first_name + profile.last_name + profile.email_field;
}

const duplicate = (profile1, profile2, fields = []) => {
	return new Promise(async (resolve, reject) => {
		let score = 0;
		const non_matching_attributes = [];
		const matching_attributes = [];
		const all_fields = Object.keys(schema);
		remove(all_fields, 'id');
		if (fields.includes('first_name') || fields.includes('last_name') || fields.includes('email_field')) {
			let check1 = await fuzz.ratio(getFLE(profile1), getFLE(profile2));
			if ( check1 > 80 ) {
				score += 1;
			}
			if (fields.includes('first_name')) {
				let check = await fuzz.ratio(profile1.first_name, profile2.first_name);
				if (check > 80) {
					matching_attributes.push('first_name');
					remove(all_fields,'first_name');
				} else {
					non_matching_attributes.push('first_name');
				}
				remove(fields, 'first_name');
			}
			if (fields.includes('last_name')) {
				let check = await fuzz.ratio(profile1.last_name, profile2.last_name);
				if (check > 80){
					matching_attributes.push('last_name');
					remove(all_fields,'last_name');
				} else {
					non_matching_attributes.push('last_name');
				}
				remove(fields,'last_name');
			}
			if (fields.includes('email_field')) {
				remove(fields,'email_field');
				remove(all_fields,'email_field');
			}
		}
		Promise.all(fields.map(async (ele) => {
			if (!(profile1[ele] || profile2[ele])) {
				let check = await fuzz.ratio(profile1[ele].toString(), profile2[ele].toString());
				if (!(check > 80)){
					non_matching_attributes.push(ele);
					score -= 1;
				} else {
					matching_attributes.push(ele);
					remove(all_fields,ele);
					score += 1;
				}
			}
		})).then(() => {
			if (score > 0) {
				resolve({
					profile1: profile1.id,
					profile2: profile2.id,
					score: score,
					matching_attributes: matching_attributes,
					non_matching_attributes: non_matching_attributes,
					ignored_attributes: all_fields
				});
			} else {
				resolve();
			}
		})
	});
}

find_duplicates = async (profiles = [], fields = []) => {
	let results = [];
	for(let i = 0; i < profiles.length; i++) {
		for (let j = i+1; j < profiles.length; j++) {
			results.push(duplicate(profiles[i], profiles[j], fields));
		}
	}
	results = await Promise.all(results);
	results = results.filter(ele => ele);
	console.log('Duplicate Profiles: ',results);
}



function compare_profile () {
	for (const key in profiles) {
		let obj = JSON.stringify(profiles[key]);
		console.log( key + ':' + obj+'\n');
	}
	let input = readline.question('\nEnter space seperated Ids of Profiles for Which You Want to Find Duplicates: ');
	let selected_profiles = input.split(' ').map( ele => { 
		let id = ele.trim();
		return profiles[id];
	})

	let fileds = '';
	Object.keys(schema).forEach(element => {
		if(element != 'id') fileds += ' ' + element;
	});
	console.log('\n'+fileds);
	input = readline.question('\nEnter space seperated fileds from the above available set: ');
	console.log('\n');
	let selected_fields = input.split(' ').map( ele => ele.trim());

	return find_duplicates(selected_profiles,selected_fields);
}
call = async () => {
	let choice = 1;
	while (true) {
		console.log('\n 1. Compare Profiles\n 0. Exit')
		let input = readline.question('\nEnter your choice: ');
		console.log('\n');

		choice = parseInt(input);
		switch (choice) {
			case 1:
				await compare_profile();
				break;
			case 0:
				console.log('\nBid Adieu');
				break;
			default:
				break;
		}
		if (choice === 0) break;
	}
}
call();

