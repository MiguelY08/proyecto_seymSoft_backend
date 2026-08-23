import test from "node:test";
import assert from "node:assert/strict";

import { CancelInstallmentUseCase } from "../../src/modules/sales/payments/use-cases/CancelInstallmentUseCase.js";
import { hashPassword } from "../../src/shared/utils/hashPassword.js";

const createRepository = ({ authenticatedUserHash }) => {
  const calls = {
    getUserById: [],
    cancelInstallmentTransaction: 0,
  };

  return {
    calls,
    async getInstallmentById() {
      return {
        id_installment: 10,
        is_cancelled: false,
        created_at: new Date(),
        installment_date: new Date(),
        installment_amount: 50000,
        id_payment_method: 1,
        capital_paid: 50000,
        credits: {
          id_credit: 20,
          remaining_balance: 100000,
          due_date: new Date(),
          clients: {
            id_client: 30,
            credit_balance: 0,
          },
        },
      };
    },
    async getUserById(idUser) {
      calls.getUserById.push(idUser);

      return {
        id_user: idUser,
        full_name: "Miguel",
        pass_word: authenticatedUserHash,
      };
    },
    async cancelInstallmentTransaction() {
      calls.cancelInstallmentTransaction += 1;
    },
  };
};

test("cancelar abono rechaza con 401 si la contraseña no pertenece al usuario autenticado", async () => {
  const miguelId = 7;
  const miguelPasswordHash = await hashPassword("ClaveDeMiguel1");
  const repository = createRepository({
    authenticatedUserHash: miguelPasswordHash,
  });
  const useCase = new CancelInstallmentUseCase(repository);

  await assert.rejects(
    () =>
      useCase.execute({
        id_installment: 10,
        reason: "Motivo valido para anular",
        password: "ClaveDeOtroUsuario1",
        userId: miguelId,
      }),
    (error) => {
      assert.equal(error.statusCode, 401);
      assert.equal(error.errorCode, "INVALID_PASSWORD");
      assert.equal(error.message, "Contraseña incorrecta");
      return true;
    },
  );

  assert.deepEqual(repository.calls.getUserById, [miguelId]);
  assert.equal(repository.calls.cancelInstallmentTransaction, 0);
});
