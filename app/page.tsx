import Link from "next/link";
import { breedGroups } from "@/lib/breeds";

export default function Home() {
  return (
    <>
      <header>
        <Link href="/"><h1>🐕 AKC Dog Breeds</h1></Link>
        <nav>
          <Link href="/">Browse</Link>
          <Link href="/quiz">Quiz Mode</Link>
        </nav>
      </header>
      
      <div className="hero">
        <h2>Explore 200+ Dog Breeds</h2>
        <p>Learn about all American Kennel Club recognized breeds, organized by group. Browse photos or test your knowledge!</p>
      </div>
      
      <div className="groups-grid">
        {breedGroups.map(group => (
          <Link key={group.slug} href={`/group/${group.slug}`} className="group-card">
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <span className="count">{group.breeds.length} breeds →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
