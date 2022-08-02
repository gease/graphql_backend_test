const express = require('express');
const graphql = require('graphql');
const expressGraphQL = require('express-graphql');
const {GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList, GraphQLNonNull} = graphql;
const _ = require('lodash');
const axios = require('axios');

const app = express();

const users  = [
    {id: 1, name: 'Jill', age: 27},
    {id: 2, name: 'Jane', age: 35}
];

const DepType = new GraphQLObjectType({
    name: 'department',
    fields: () => ({
        id: {type: GraphQLString},
        name: {type: GraphQLString},
        users: {type: new GraphQLList(UserType), resolve(parentValue, args) {
            console.log(parentValue);
            return axios.get(`http://localhost:3000/departments/${parentValue.id}/users`).then(response => response.data);
        }}
    })
});

const UserType = new GraphQLObjectType({
    name: 'user',
    fields: () => ({
        id: {type: GraphQLInt},
        name: {type: GraphQLString},
        age: {type: GraphQLInt},
        department: {type: DepType, resolve(parentValue, args) {
            return axios.get(`http://localhost:3000/departments/${parentValue.departmentId}`).then(response => response.data);
            }}
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: {id: {type: GraphQLInt}},
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/users/${args.id}`).then(response => response.data);
            }
        },
        department: {
            type: DepType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/departments/${args.id}`).then(response => response.data);
            }
        }

    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                name: {type: new GraphQLNonNull(GraphQLString)},
                age: {type: new GraphQLNonNull(GraphQLInt)},
                department: {type: GraphQLString}
            },
            resolve(parentValue, {name, age, department}) {
                return axios.post('http://localhost:3000/users', {
                    name,
                    age,
                    department
                }).then(response => response.data);
            }
        },
        deleteUser: {
            type: UserType,
            args: {id: {type: new GraphQLNonNull(GraphQLInt)}},
            resolve(parentValue, {id}) {
                return axios.delete(`http://localhost:3000/users/${id}`).then(response => response.data);
            }
        },
        editUser: {
            type: UserType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLInt)},
                name: {type: GraphQLString},
                age: {type: GraphQLInt},
                department: {type: GraphQLString}
            },
            resolve(parentValue, {id, ...patchArgs}) {
                return axios.patch(`http://localhost:3000/users/${id}`, patchArgs).then(response => response.data);
            }
        }
    }
});

const schema = new GraphQLSchema({query: RootQuery, mutation: mutation});

app.use('/graphql', expressGraphQL.graphqlHTTP({
    schema,
    graphiql: true
}));

app.listen(4000, () => {
    console.log('Listening');
});
