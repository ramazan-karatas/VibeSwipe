module vibeswipe::reward_pool {
    use sui::balance;
    use sui::coin;
    use sui::coin::Coin;
    use sui::object;
    use sui::object::UID;
    use sui::sui::SUI;
    use sui::table;
    use sui::transfer;
    use sui::tx_context;
    use sui::tx_context::TxContext;
    use std::vector;

    const E_POOL_PAID_OUT: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_LENGTH_MISMATCH: u64 = 3;
    const E_NOT_ADMIN: u64 = 4;

    /// Top-level shared object holding per-tournament pools.
    /// Stores an admin address that is allowed to trigger payouts.
    struct Pools has key {
        id: UID,
        admin: address,
        entries: table::Table<u64, PoolEntry>,
    }

    /// Balance per tournament and a payout guard.
    struct PoolEntry has store {
        balance: balance::Balance<SUI>,
        paid_out: bool,
    }

    /// Publish the Pools object and share it; caller becomes admin.
    public entry fun create_pools(ctx: &mut TxContext) {
        let pools = Pools {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            entries: table::new<u64, PoolEntry>(ctx),
        };
        transfer::share_object(pools);
    }

    /// Join a tournament by contributing SUI entry fee into the pool.
    public entry fun join(pools: &mut Pools, tournament_id: u64, payment: Coin<SUI>) {
        let entry = borrow_or_create_entry(pools, tournament_id);
        assert!(!entry.paid_out, E_POOL_PAID_OUT);

        let payment_balance = coin::into_balance(payment);
        balance::join(&mut entry.balance, payment_balance);
    }

    /// Payout winners for a tournament; only admin may call.
    /// `recipients` and `amounts` must align; amounts are in MIST.
    public entry fun payout(
        pools: &mut Pools,
        tournament_id: u64,
        recipients: vector<address>,
        amounts: vector<u64>,
        ctx: &mut TxContext
    ) {
        assert!(vector::length(&recipients) == vector::length(&amounts), E_LENGTH_MISMATCH);
        assert!(tx_context::sender(ctx) == pools.admin, E_NOT_ADMIN);

        let entry = borrow_or_create_entry(pools, tournament_id);
        assert!(!entry.paid_out, E_POOL_PAID_OUT);

        let i: u64 = 0;
        let recipients_len = vector::length(&recipients);
        while (i < recipients_len) {
            let amt = *vector::borrow(&amounts, i);
            let available = balance::value(&entry.balance);
            assert!(available >= amt, E_INSUFFICIENT_BALANCE);

            let part = balance::split(&mut entry.balance, amt);
            let coin_part = coin::from_balance(part, ctx);
            let recipient = *vector::borrow(&recipients, i);
            transfer::public_transfer(coin_part, recipient);

            i = i + 1;
        };

        entry.paid_out = true;
    }

    /// Helper: ensure a pool entry exists for tournament.
    fun borrow_or_create_entry(pools: &mut Pools, tournament_id: u64): &mut PoolEntry {
        if (!table::contains(&pools.entries, tournament_id)) {
            let entry = PoolEntry {
                balance: balance::zero<SUI>(),
                paid_out: false,
            };
            table::add(&mut pools.entries, tournament_id, entry);
        };
        table::borrow_mut(&mut pools.entries, tournament_id)
    }
}
