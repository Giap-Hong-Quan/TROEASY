import ApiError from "../exceptions/ApiError.js";
import Area from "../models/Area.js";
import Expense from "../models/Expense.js";

const toExpense = (expense) => ({
    id: expense._id,
    areaId: expense.areaId,
    name: expense.name,
    amount: expense.amount,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
});

const getExpenseOrThrow = async (id) => {
    const expense = await Expense.findById(id);
    if (!expense) throw new ApiError(404, "Không tìm thấy khoản chi.");
    return expense;
};

const ensureAreaExists = async (areaId) => {
    if (!(await Area.exists({ _id: areaId }))) {
        throw new ApiError(404, "Không tìm thấy khu vực.");
    }
};

export const createExpense = async ({ areaId, name, amount }) => {
    await ensureAreaExists(areaId);
    const expense = await Expense.create({
        areaId,
        name: name.trim(),
        amount: Number(amount),
    });
    return toExpense(expense);
};

export const listExpenses = async (filters = {}) => {
    const query = {};
    if (filters.areaId) query.areaId = filters.areaId;

    const expenses = await Expense.find(query).sort({ createdAt: -1, _id: -1 });
    return expenses.map(toExpense);
};

export const getExpenseById = async (id) => toExpense(await getExpenseOrThrow(id));

export const updateExpense = async (id, updates) => {
    const expense = await getExpenseOrThrow(id);

    if (updates.name !== undefined) {
        expense.name = updates.name.trim();
    }
    if (updates.amount !== undefined) {
        expense.amount = Number(updates.amount);
    }

    await expense.save();
    return toExpense(expense);
};

export const deleteExpense = async (id) => {
    const expense = await getExpenseOrThrow(id);
    const expenseData = toExpense(expense);
    await expense.deleteOne();
    return expenseData;
};

