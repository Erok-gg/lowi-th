/// LOWI — Chalok Baan Kao Pool Villa
/// Ko Phangan, Thaïlande — Bail emphytéotique 20 ans
///
/// 128 parts totales · 100 000 THB/part (≈ 2 500 €)
/// TRI cible 11,2% · Distribution plafonnée à 8 %/an (lissage de performance)
/// Excédent → Réserve · Sortie à l'AGE ou fin de bail
///
/// Algorithme de distribution
/// ──────────────────────────
/// Chaque trimestre, l'admin enregistre le revenu brut (gross_income_thb).
/// Distributable_max = 8 % × capital_total / 4  (par part : 8 000 THB/an → 2 000 THB/trim)
/// Si revenu > distributable_max → excédent crédité à reserve_thb
/// Sortie de réserve : vote AGE (>50 % des parts) ou automatique en fin de bail

module chalok_villa_nft::chalok_villa_nft {

    use std::string::{Self, String};
    use sui::object::{Self, ID, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::package;
    use sui::display;
    use sui::vec_map::{Self, VecMap};

    // ── Erreurs ───────────────────────────────────────────────────────────────

    const E_SUPPLY_EXHAUSTED:     u64 = 1;
    const E_ALREADY_FINALIZED:    u64 = 2;
    const E_NOT_ENOUGH_PARTS:     u64 = 3;
    const E_INVALID_PARTS:        u64 = 4;
    const E_NO_OPEN_PROPOSAL:     u64 = 5;
    const E_ALREADY_VOTED:        u64 = 6;
    const E_PROPOSAL_STILL_OPEN:  u64 = 7;
    const E_PROPOSAL_REJECTED:    u64 = 8;
    const E_AMOUNT_EXCEEDS_RESERVE: u64 = 9;

    // ── Constantes projet ────────────────────────────────────────────────────

    const TOTAL_SUPPLY:       u64 = 128;
    const MIN_TICKET:         u64 = 5;
    const PRICE_PER_PART_THB: u64 = 100_000;   // THB
    const TOTAL_PRICE_THB:    u64 = 12_800_000; // THB
    const LEASE_YEARS:        u64 = 20;

    /// Plafond annuel de distribution = 8 % du capital par part
    /// → 8 000 THB/part/an → 2 000 THB/part/trimestre
    const DIST_CAP_BPS:       u64 = 800;  // 8,00 %
    const DIST_CAP_PER_PART_QUARTER_THB: u64 = 2_000; // THB

    // ── OTW ──────────────────────────────────────────────────────────────────

    public struct CHALOK_VILLA_NFT has drop {}

    // ── Objets ───────────────────────────────────────────────────────────────

    public struct AdminCap has key, store { id: UID }

    /// Registre global — partagé (shared object)
    public struct Collection has key {
        id: UID,
        minted:             u64,
        participants:       VecMap<address, u64>,
        finalized:          bool,
        // ── Comptabilité de distribution ──
        quarter:            u64,   // trimestre courant (1-based)
        distributed_thb:    u64,   // total distribué aux investisseurs
        reserve_thb:        u64,   // excédent au-delà du plafond 8 %
        // ── Vote AGE en cours ──
        agm_open:           bool,
        agm_amount_thb:     u64,
        agm_yes_parts:      u64,
        agm_no_parts:       u64,
        agm_voters:         VecMap<address, bool>,
    }

    /// NFT de participation (N parts)
    public struct VillaShare has key, store {
        id:                  UID,
        serial:              u64,
        parts:               u64,
        investor:            address,
        investor_name:       String,
        name:                String,
        description:         String,
        image_url:           String,
        project_url:         String,
        property_name:       String,
        location:            String,
        lease_years:         u64,
        price_per_part_thb:  u64,
        dist_cap_bps:        u64,
        tri_target_bps:      u64,
    }

    // ── Événements ────────────────────────────────────────────────────────────

    public struct MintEvent has copy, drop {
        nft_id:    ID,
        investor:  address,
        name:      String,
        parts:     u64,
        serial:    u64,
        total_thb: u64,
    }

    public struct QuarterlyDistributionEvent has copy, drop {
        quarter:           u64,
        gross_income_thb:  u64,
        distributed_thb:   u64,
        added_to_reserve:  u64,
        reserve_total:     u64,
    }

    public struct AgmProposalEvent has copy, drop {
        amount_thb: u64,
        quarter:    u64,
    }

    public struct AgmVoteEvent has copy, drop {
        voter:   address,
        parts:   u64,
        approve: bool,
    }

    public struct AgmExecutedEvent has copy, drop {
        amount_thb:  u64,
        yes_parts:   u64,
        no_parts:    u64,
        passed:      bool,
    }

    public struct CollectionFinalizedEvent has copy, drop {
        total_minted: u64,
        total_thb:    u64,
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    fun init(otw: CHALOK_VILLA_NFT, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        let mut disp = display::new<VillaShare>(&publisher, ctx);
        display::add(&mut disp, string::utf8(b"name"),        string::utf8(b"{name}"));
        display::add(&mut disp, string::utf8(b"description"), string::utf8(b"{description}"));
        display::add(&mut disp, string::utf8(b"image_url"),   string::utf8(b"{image_url}"));
        display::add(&mut disp, string::utf8(b"project_url"), string::utf8(b"{project_url}"));
        display::update_version(&mut disp);

        transfer::public_transfer(disp, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));

        transfer::share_object(Collection {
            id:               object::new(ctx),
            minted:           0,
            participants:     vec_map::empty(),
            finalized:        false,
            quarter:          0,
            distributed_thb:  0,
            reserve_thb:      0,
            agm_open:         false,
            agm_amount_thb:   0,
            agm_yes_parts:    0,
            agm_no_parts:     0,
            agm_voters:       vec_map::empty(),
        });

        transfer::transfer(AdminCap { id: object::new(ctx) }, tx_context::sender(ctx));
    }

    // ── Mint ──────────────────────────────────────────────────────────────────

    public entry fun mint(
        _cap:          &AdminCap,
        collection:    &mut Collection,
        parts:         u64,
        investor_name: vector<u8>,
        recipient:     address,
        ctx:           &mut TxContext,
    ) {
        assert!(!collection.finalized, E_ALREADY_FINALIZED);
        assert!(parts >= MIN_TICKET, E_NOT_ENOUGH_PARTS);
        assert!(parts > 0, E_INVALID_PARTS);
        assert!(collection.minted + parts <= TOTAL_SUPPLY, E_SUPPLY_EXHAUSTED);

        let serial    = collection.minted + 1;
        let total_thb = parts * PRICE_PER_PART_THB;
        let name_str  = string::utf8(investor_name);

        let nft = VillaShare {
            id:                  object::new(ctx),
            serial,
            parts,
            investor:            recipient,
            investor_name:       name_str,
            name:                build_name(parts),
            description:         build_description(parts),
            image_url:           string::utf8(b"https://lowi.app/img/chalok-baan-kao.jpg"),
            project_url:         string::utf8(b"https://lowi.app/projet-chalok-villa"),
            property_name:       string::utf8(b"Chalok Baan Kao Pool Villa"),
            location:            string::utf8(b"Ko Phangan, Thailand"),
            lease_years:         LEASE_YEARS,
            price_per_part_thb:  PRICE_PER_PART_THB,
            dist_cap_bps:        DIST_CAP_BPS,
            tri_target_bps:      1120,
        };

        event::emit(MintEvent {
            nft_id:    object::id(&nft),
            investor:  recipient,
            name:      name_str,
            parts,
            serial,
            total_thb,
        });

        collection.minted = collection.minted + parts;

        if (vec_map::contains(&collection.participants, &recipient)) {
            let cur = *vec_map::get(&collection.participants, &recipient);
            vec_map::remove(&mut collection.participants, &recipient);
            vec_map::insert(&mut collection.participants, recipient, cur + parts);
        } else {
            vec_map::insert(&mut collection.participants, recipient, parts);
        };

        transfer::public_transfer(nft, recipient);
    }

    public entry fun finalize(_cap: &AdminCap, collection: &mut Collection) {
        assert!(!collection.finalized, E_ALREADY_FINALIZED);
        collection.finalized = true;
        event::emit(CollectionFinalizedEvent {
            total_minted: collection.minted,
            total_thb:    collection.minted * PRICE_PER_PART_THB,
        });
    }

    // ── Algorithme de distribution trimestrielle ──────────────────────────────
    //
    //  Plafond par trimestre = minted × 2 000 THB/part
    //  Si revenu_brut ≤ plafond → tout est distribué (revenu_brut)
    //  Si revenu_brut > plafond → plafond distribué, excédent → réserve
    //
    //  Aucun coin ne bouge on-chain : l'admin enregistre les montants,
    //  les virements THB sont exécutés off-chain selon ces calculs.

    public entry fun record_quarter_income(
        _cap:             &AdminCap,
        collection:       &mut Collection,
        gross_income_thb: u64,
        ctx:              &mut TxContext,
    ) {
        let _ = ctx;
        let cap_this_quarter = collection.minted * DIST_CAP_PER_PART_QUARTER_THB;

        let (distributed, added_to_reserve) = if (gross_income_thb <= cap_this_quarter) {
            (gross_income_thb, 0u64)
        } else {
            (cap_this_quarter, gross_income_thb - cap_this_quarter)
        };

        collection.quarter           = collection.quarter + 1;
        collection.distributed_thb   = collection.distributed_thb + distributed;
        collection.reserve_thb       = collection.reserve_thb + added_to_reserve;

        event::emit(QuarterlyDistributionEvent {
            quarter:          collection.quarter,
            gross_income_thb,
            distributed_thb:  distributed,
            added_to_reserve,
            reserve_total:    collection.reserve_thb,
        });
    }

    // ── Vote AGE — déblocage de réserve ───────────────────────────────────────

    /// L'admin ouvre un vote AGE pour débloquer `amount_thb` de la réserve
    public entry fun agm_open_proposal(
        _cap:       &AdminCap,
        collection: &mut Collection,
        amount_thb: u64,
        ctx:        &mut TxContext,
    ) {
        let _ = ctx;
        assert!(!collection.agm_open, E_PROPOSAL_STILL_OPEN);
        assert!(amount_thb <= collection.reserve_thb, E_AMOUNT_EXCEEDS_RESERVE);

        collection.agm_open        = true;
        collection.agm_amount_thb  = amount_thb;
        collection.agm_yes_parts   = 0;
        collection.agm_no_parts    = 0;
        collection.agm_voters      = vec_map::empty();

        event::emit(AgmProposalEvent { amount_thb, quarter: collection.quarter });
    }

    /// Un détenteur vote avec son NFT (poids = parts)
    public entry fun agm_vote(
        nft:        &VillaShare,
        collection: &mut Collection,
        approve:    bool,
        ctx:        &mut TxContext,
    ) {
        assert!(collection.agm_open, E_NO_OPEN_PROPOSAL);
        let voter = tx_context::sender(ctx);
        assert!(!vec_map::contains(&collection.agm_voters, &voter), E_ALREADY_VOTED);

        vec_map::insert(&mut collection.agm_voters, voter, approve);

        if (approve) {
            collection.agm_yes_parts = collection.agm_yes_parts + nft.parts;
        } else {
            collection.agm_no_parts = collection.agm_no_parts + nft.parts;
        };

        event::emit(AgmVoteEvent { voter, parts: nft.parts, approve });
    }

    /// Clôture le vote et exécute si majorité simple (>50 % des parts mintées)
    public entry fun agm_execute(
        _cap:       &AdminCap,
        collection: &mut Collection,
        ctx:        &mut TxContext,
    ) {
        let _ = ctx;
        assert!(collection.agm_open, E_NO_OPEN_PROPOSAL);

        let threshold  = collection.minted / 2 + 1; // majorité simple
        let passed     = collection.agm_yes_parts >= threshold;

        if (passed) {
            collection.reserve_thb = collection.reserve_thb - collection.agm_amount_thb;
            // Le virement off-chain du montant est effectué par LOWI
        };

        event::emit(AgmExecutedEvent {
            amount_thb:  collection.agm_amount_thb,
            yes_parts:   collection.agm_yes_parts,
            no_parts:    collection.agm_no_parts,
            passed,
        });

        collection.agm_open       = false;
        collection.agm_amount_thb = 0;
        collection.agm_yes_parts  = 0;
        collection.agm_no_parts   = 0;
        collection.agm_voters     = vec_map::empty();
    }

    // ── Sortie de liquidités en fin de bail ───────────────────────────────────
    // Calcul de la quote-part de réserve pour un NFT donné (lecture seule)

    public fun compute_exit_share(nft: &VillaShare, collection: &Collection): u64 {
        if (collection.minted == 0) { return 0 };
        collection.reserve_thb * nft.parts / collection.minted
    }

    // ── Transfer ──────────────────────────────────────────────────────────────

    public entry fun transfer_share(
        nft:       VillaShare,
        recipient: address,
        ctx:       &mut TxContext,
    ) {
        transfer::public_transfer(nft, recipient);
        let _ = ctx;
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    public fun parts(n: &VillaShare): u64            { n.parts }
    public fun serial(n: &VillaShare): u64           { n.serial }
    public fun investor(n: &VillaShare): address     { n.investor }
    public fun investor_name(n: &VillaShare): String { n.investor_name }
    public fun total_supply(): u64                   { TOTAL_SUPPLY }
    public fun price_per_part(): u64                 { PRICE_PER_PART_THB }
    public fun dist_cap_bps(): u64                   { DIST_CAP_BPS }
    public fun collection_minted(c: &Collection): u64   { c.minted }
    public fun collection_reserve(c: &Collection): u64  { c.reserve_thb }
    public fun collection_quarter(c: &Collection): u64  { c.quarter }

    // ── Helpers ───────────────────────────────────────────────────────────────

    fun build_name(parts: u64): String {
        let mut s = string::utf8(b"LOWI \xE2\x80\x94 Chalok Villa \xC2\xB7 ");
        string::append(&mut s, u64_to_string(parts));
        string::append(&mut s, string::utf8(b" part(s)"));
        s
    }

    fun build_description(parts: u64): String {
        let mut s = string::utf8(
            b"Participation fractionnee - Chalok Baan Kao Pool Villa, Ko Phangan (bail 20 ans). "
        );
        string::append(&mut s, u64_to_string(parts));
        string::append(&mut s, string::utf8(
            b" part(s) x 100 000 THB. Distribution plafonnee a 8%/an, excedent en reserve AGE. TRI cible 11,2%."
        ));
        s
    }

    fun u64_to_string(mut n: u64): String {
        if (n == 0) { return string::utf8(b"0") };
        let mut bytes = vector::empty<u8>();
        while (n > 0) {
            vector::push_back(&mut bytes, ((n % 10) as u8) + 48u8);
            n = n / 10;
        };
        vector::reverse(&mut bytes);
        string::utf8(bytes)
    }
}
