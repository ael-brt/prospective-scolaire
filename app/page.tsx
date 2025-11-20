export default function Home() {
  return (
    <section className="card p-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-accent">NGSI-LD</p>
        <h2 className="text-3xl font-bold text-white">
          Bienvenue sur la plateforme de prospective scolaire
        </h2>
        <p className="text-muted max-w-2xl">
          Explorez vos données, projetez des scénarios et synchronisez vos simulations
          avec votre context broker NGSI-LD.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <a className="cta" href="/dashboard">
          Accéder au tableau de bord
        </a>
        <a className="secondary" href="/simulations">
          Lancer une simulation
        </a>
      </div>
    </section>
  );
}
