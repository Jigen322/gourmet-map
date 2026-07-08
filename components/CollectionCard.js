import Link from 'next/link'

export default function CollectionCard({ collection, dishCount }) {
  return (
    <Link href={`/collections/${collection.id}`} className="collection-card">
      <div
        className="collection-card-bg"
        style={collection.image_url ? { backgroundImage: `url('${collection.image_url}')` } : {}}
      />
      <div className="collection-card-body">
        <span className="collection-card-type">
          {collection.collection_type === 'auto' ? '自動' : '手動'}
        </span>
        <h3 className="collection-card-title">{collection.name}</h3>
        {collection.description && (
          <p className="collection-card-desc">{collection.description}</p>
        )}
        <span className="collection-card-count">{dishCount ?? '?'}種類の料理</span>
      </div>
    </Link>
  )
}
