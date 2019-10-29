export const conjunctions = {
    or: (results: [boolean]) => {
        return results.reduce((result, value) => result || value);
    },
    and: (results: [boolean]) => {
        return results.reduce((result, value) => result && value);
    },
};
