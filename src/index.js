const { v4: uuidv4 } = require("uuid");
const express = require("express");

const app = express();

const customers = [];

app.use(express.json());

const verifyIfExistsAccountCPF = (req, res, next) => {
  const { cpf } = req.headers;
  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(404).send({ error: "Customer not found" });
  }

  req.customer = customer;

  return next();
};

const getBalance = (statement) => {
  return statement.reduce((acc, operation) => {
    acc =
      operation.type === "deposit"
        ? acc + operation.amount
        : acc - operation.amount;

    return acc;
  }, 0);
};

app.post("/accounts", (req, res) => {
  const { cpf, name } = req.body;
  const id = uuidv4();

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).send({ error: "Customer already exists" });
  }

  customers.push({
    id,
    cpf,
    name,
    statement: [],
  });

  return res.status(201).send();
});

app.get("/accounts", (req, res) => {
  return res.status(200).send(customers);
});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  return res.status(200).send(customer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { description, amount } = req.body;

  const statementOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: "deposit",
  };

  customer.statement.push(statementOperation);
  return res.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { amount } = req.body;

  console.log(amount, customer);
  const balance = getBalance(customer.statement);

  if (amount > balance) {
    return res.status(400).send({ error: "Insufficient funds" });
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: "withdraw",
  };

  customer.statement.push(statementOperation);
  return res.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );

  return res.status(200).send(statement);
});

app.put("/accounts", verifyIfExistsAccountCPF, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  return res.status(204).send(customer);
});

app.delete("/accounts", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  customers.splice(customer, 1);

  return res.status(204).send();
});

app.get("/accounts/balance", verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.status(200).send({ balance });
});

app.listen(3031, () => {
  console.log("listening on 3031");
});
