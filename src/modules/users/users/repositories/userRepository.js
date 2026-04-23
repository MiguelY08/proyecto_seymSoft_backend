// const prisma  = require("../../../../config/prisma");

// class userRepository = {
//     getAll: async () => {
//         return await prisma.user.findMany();
//     },
//     getById: async (id_user) => {
//         return await prisma.user.findOne({ where: { id_user } });
//     },
//     create: async (data_user) => {
//         return await prisma.user.create({data_user});
//     },
//     update: async (id_user, data_user) => {
//         return await prisma.user.update({ where: { id_user }, data: data_user });
//     },
//     delete: async (id_user) => {
//         return await prisma.user.delete({ where: { id_user } });
//     }
// }

// module.exports = userRepository