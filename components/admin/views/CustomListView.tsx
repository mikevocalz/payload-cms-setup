'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useConfig } from '@payloadcms/ui'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import './list-view.css'

interface Document {
  id: string | number
  [key: string]: any
}

interface ListViewProps {
  collectionSlug: string
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export const CustomListView: React.FC<ListViewProps> = ({ collectionSlug }) => {
  const { config } = useConfig()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [docs, setDocs] = useState<Document[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 10
  const sort = searchParams.get('sort') || '-updatedAt'

  const collection = config.collections?.find(c => c.slug === collectionSlug)
  
  const collectionLabel = typeof collection?.labels?.plural === 'string'
    ? collection.labels.plural
    : collectionSlug.charAt(0).toUpperCase() + collectionSlug.slice(1)

  const totalPages = Math.ceil(totalDocs / limit)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort,
        depth: '0',
      })
      
      if (searchQuery) {
        params.set('where[or][0][title][contains]', searchQuery)
        params.set('where[or][1][name][contains]', searchQuery)
        params.set('where[or][2][email][contains]', searchQuery)
      }

      const response = await fetch(`/api/${collectionSlug}?${params}`)
      const data = await response.json()
      
      setDocs(data.docs || [])
      setTotalDocs(data.totalDocs || 0)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }, [collectionSlug, page, limit, sort, searchQuery])

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ page: '1' })
    fetchDocs()
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateParams({ page: String(newPage) })
    }
  }

  const handleSort = (field: string) => {
    const newSort = sort === field ? `-${field}` : sort === `-${field}` ? field : `-${field}`
    updateParams({ sort: newSort })
  }

  const handleEdit = (id: string | number) => {
    router.push(`/admin/collections/${collectionSlug}/${id}`)
  }

  const handleCreate = () => {
    router.push(`/admin/collections/${collectionSlug}/create`)
  }

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await fetch(`/api/${collectionSlug}/${id}`, { method: 'DELETE' })
      fetchDocs()
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.size === docs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(docs.map(d => d.id)))
    }
  }

  const handleSelect = (id: string | number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const getDocumentTitle = (doc: Document): string => {
    return doc.title || doc.name || doc.email || doc.username || `#${doc.id}`
  }

  const displayFields = ['title', 'name', 'email', 'username', 'status', 'createdAt', 'updatedAt']
    .filter(field => docs.length > 0 && docs[0][field] !== undefined)
    .slice(0, 5)

  return (
    <div className="custom-list-view">
      <header className="list-view__header">
        <div className="list-view__title-row">
          <h1 className="list-view__title">{collectionLabel}</h1>
          <span className="list-view__count">{totalDocs.toLocaleString()} documents</span>
        </div>

        <div className="list-view__actions">
          <form className="list-view__search" onSubmit={handleSearch}>
            <SearchIcon />
            <input
              type="text"
              placeholder={`Search ${collectionLabel.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="list-view__search-input"
            />
          </form>

          <button
            type="button"
            className="list-view__create-btn"
            onClick={handleCreate}
          >
            <PlusIcon />
            <span>Create New</span>
          </button>
        </div>
      </header>

      <div className="list-view__table-container">
        {loading ? (
          <div className="list-view__loading">
            <div className="list-view__spinner" />
            <span>Loading documents...</span>
          </div>
        ) : docs.length === 0 ? (
          <div className="list-view__empty">
            <p>No documents found</p>
            <button
              type="button"
              className="list-view__create-btn"
              onClick={handleCreate}
            >
              <PlusIcon />
              <span>Create your first {typeof collection?.labels?.singular === 'string' ? collection.labels.singular : 'document'}</span>
            </button>
          </div>
        ) : (
          <table className="list-view__table">
            <thead>
              <tr>
                <th className="list-view__th list-view__th--checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === docs.length}
                    onChange={handleSelectAll}
                    className="list-view__checkbox"
                  />
                </th>
                <th
                  className="list-view__th list-view__th--sortable"
                  onClick={() => handleSort('id')}
                >
                  ID
                  {sort.includes('id') && (
                    <span className="list-view__sort-indicator">
                      {sort.startsWith('-') ? '↓' : '↑'}
                    </span>
                  )}
                </th>
                {displayFields.map(field => (
                  <th
                    key={field}
                    className="list-view__th list-view__th--sortable"
                    onClick={() => handleSort(field)}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    {sort.replace('-', '') === field && (
                      <span className="list-view__sort-indicator">
                        {sort.startsWith('-') ? '↓' : '↑'}
                      </span>
                    )}
                  </th>
                ))}
                <th className="list-view__th list-view__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map(doc => (
                <tr
                  key={doc.id}
                  className={`list-view__tr ${selectedIds.has(doc.id) ? 'list-view__tr--selected' : ''}`}
                >
                  <td className="list-view__td list-view__td--checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(doc.id)}
                      onChange={() => handleSelect(doc.id)}
                      className="list-view__checkbox"
                    />
                  </td>
                  <td className="list-view__td list-view__td--id">
                    <button
                      type="button"
                      className="list-view__id-link"
                      onClick={() => handleEdit(doc.id)}
                    >
                      {doc.id}
                    </button>
                  </td>
                  {displayFields.map(field => (
                    <td key={field} className="list-view__td">
                      {field.includes('At') && doc[field]
                        ? new Date(doc[field]).toLocaleDateString()
                        : typeof doc[field] === 'boolean'
                        ? doc[field] ? 'Yes' : 'No'
                        : doc[field] || '—'}
                    </td>
                  ))}
                  <td className="list-view__td list-view__td--actions">
                    <div className="list-view__action-buttons">
                      <button
                        type="button"
                        className="list-view__action-btn"
                        onClick={() => handleEdit(doc.id)}
                        title="View"
                      >
                        <EyeIcon />
                      </button>
                      <button
                        type="button"
                        className="list-view__action-btn"
                        onClick={() => handleEdit(doc.id)}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="list-view__action-btn list-view__action-btn--danger"
                        onClick={() => handleDelete(doc.id)}
                        title="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <footer className="list-view__pagination">
          <div className="list-view__pagination-info">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalDocs)} of {totalDocs}
          </div>
          <div className="list-view__pagination-controls">
            <button
              type="button"
              className="list-view__page-btn"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeftIcon />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`list-view__page-btn ${page === pageNum ? 'list-view__page-btn--active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}
            
            <button
              type="button"
              className="list-view__page-btn"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

export default CustomListView
