import { BucketManager } from "@/components/bucket-manager"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 font-mono">R2 Bucket Manager</h1>
      <BucketManager />
    </div>
  )
}

