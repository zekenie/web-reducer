import getSafeDependencyOrder from "../db/get-safe-dependency-order";

(async () => {
  console.log(
    JSON.stringify(
      {
        server: await getSafeDependencyOrder(process.env.DATABASE_URL!),
        secrets: await getSafeDependencyOrder(
          process.env.SECRETS_DATABASE_URL!
        ),
      },
      null,
      2
    )
  );
})();
