module vibeswipe::reward_pool {
    use sui::coin;
    use sui::object;
    use sui::tx_context::{self, TxContext};

    /// Placeholder struct to keep the Move package valid. Real storage will be added in Phase 7.
    struct Pool has key {
        id: object::UID,
    }

    public entry fun init(ctx: &mut TxContext) {
        let pool = Pool { id: object::new(ctx) };
        // Prevent unused variable warning in future edits.
        let _ = pool;
    }
}
