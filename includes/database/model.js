module.exports = function (input) {
	const force = false;

	const Users = require("./models/users")(input);
	const Threads = require("./models/threads")(input);
	const Currencies = require("./models/currencies")(input);
	const Pets = require("./models/Pets")(input);
	const PetCurrency = require("./models/PetCurrency")(input);

	Users.sync({ force });
	Threads.sync({ force });
	Currencies.sync({ force });
	Pets.sync({ force });
	PetCurrency.sync({ force });

	return {
		model: {
			Users,
			Threads,
			Currencies,
			Pets,
			PetCurrency,
		},

		use: function (modelName) {
			return this.model[`${modelName}`];
		}
	}
}