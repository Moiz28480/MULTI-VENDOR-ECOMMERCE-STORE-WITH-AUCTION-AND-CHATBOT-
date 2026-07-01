import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { databases, storage } from '../../lib/appwrite.js';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';
const PRODUCT_IMAGES_BUCKET_ID = 'product_images';

const extractStorageFileId = (imageUrl) => {
    if (!imageUrl) {
        return null;
    }

    try {
        const parsedUrl = new URL(imageUrl, window.location.origin);
        const parts = parsedUrl.pathname.split('/').filter(Boolean);
        const bucketIndex = parts.indexOf('buckets');
        const filesIndex = parts.indexOf('files');

        if (bucketIndex < 0 || filesIndex < 0) {
            return null;
        }

        const bucketId = parts[bucketIndex + 1];
        const fileId = parts[filesIndex + 1];

        if (bucketId !== PRODUCT_IMAGES_BUCKET_ID || !fileId) {
            return null;
        }

        return fileId;
    } catch {
        return null;
    }
};

const VendorInventoryTable = ({ rows = [], showAll = false, onRowsChanged = () => {} }) => {
    const [tableRows, setTableRows] = useState(rows);
    const [editingProductId, setEditingProductId] = useState('');
    const [editForm, setEditForm] = useState({ name: '', stock: '', price: '' });
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    useEffect(() => {
        setTableRows(rows);
    }, [rows]);

    const visibleRows = useMemo(() => (showAll ? tableRows : tableRows.slice(0, 5)), [showAll, tableRows]);

    const handleEditStart = (product) => {
        setActionError('');
        setActionSuccess('');
        setEditingProductId(product.$id);
        setEditForm({
            name: product.name || '',
            stock: String(product.stock ?? 0),
            price: String(product.price ?? 0),
        });
    };

    const handleEditChange = (event) => {
        const { name, value } = event.target;
        setEditForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleEditCancel = () => {
        setEditingProductId('');
        setEditForm({ name: '', stock: '', price: '' });
    };

    const handleEditSave = async (productId) => {
        setBusy(true);
        setActionError('');
        setActionSuccess('');

        try {
            const payload = {
                name: editForm.name.trim(),
                stock: Number(editForm.stock),
                price: Number(editForm.price),
            };

            await databases.updateDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                productId,
                payload,
            );

            setTableRows((previous) => previous.map((product) => (
                product.$id === productId
                    ? {
                        ...product,
                        ...payload,
                    }
                    : product
            )));

            setActionSuccess('Product updated successfully.');
            setEditingProductId('');
            setEditForm({ name: '', stock: '', price: '' });
            onRowsChanged();
        } catch (error) {
            setActionError(error?.message || 'Unable to update product.');
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget?.$id) {
            return;
        }

        setBusy(true);
        setActionError('');
        setActionSuccess('');

        try {
            const storageFileId = extractStorageFileId(deleteTarget.imageUrl);

            if (storageFileId) {
                try {
                    await storage.deleteFile(PRODUCT_IMAGES_BUCKET_ID, storageFileId);
                } catch (fileDeleteError) {
                    const fileDeleteCode = fileDeleteError?.code ?? fileDeleteError?.response?.code;

                    if (fileDeleteCode !== 404) {
                        throw fileDeleteError;
                    }
                }
            }

            await databases.deleteDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                deleteTarget.$id,
            );

            setTableRows((previous) => previous.filter((product) => product.$id !== deleteTarget.$id));
            setDeleteTarget(null);
            setActionSuccess('Product deleted successfully.');
            onRowsChanged();
        } catch (error) {
            setActionError(error?.message || 'Unable to delete product.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="vendor-card vendor-inventory-card">
            <div className="vendor-card-header vendor-card-header--spaced">
                <h2>Product Inventory</h2>
                {!showAll ? <Link to="/inventory" className="vendor-view-all-link">View All</Link> : null}
            </div>

            {actionError ? <p className="vendor-dashboard-error vendor-inventory-feedback">{actionError}</p> : null}
            {actionSuccess ? <p className="vendor-inventory-success vendor-inventory-feedback">{actionSuccess}</p> : null}

            <div className="vendor-inventory-table-wrap">
                <table className="vendor-inventory-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Sales</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRows.length ? (
                            visibleRows.map((product, index) => (
                                <tr key={product.$id}>
                                    <td>{index + 1}</td>
                                    <td className="vendor-product-name">
                                        {editingProductId === product.$id ? (
                                            <input
                                                className="vendor-inline-input"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditChange}
                                            />
                                        ) : (product.name || '-')}
                                    </td>
                                    <td>
                                        {editingProductId === product.$id ? (
                                            <input
                                                className="vendor-inline-input"
                                                type="number"
                                                min="0"
                                                name="stock"
                                                value={editForm.stock}
                                                onChange={handleEditChange}
                                            />
                                        ) : Number(product.stock ?? product.quantity ?? 0)}
                                    </td>
                                    <td>
                                        {editingProductId === product.$id ? (
                                            <input
                                                className="vendor-inline-input"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                name="price"
                                                value={editForm.price}
                                                onChange={handleEditChange}
                                            />
                                        ) : `$${Number(product.price ?? 0).toLocaleString()}`}
                                    </td>
                                    <td>{Number(product.sales ?? 0).toLocaleString()}</td>
                                    <td>
                                        <div className="vendor-table-actions">
                                            {editingProductId === product.$id ? (
                                                <>
                                                    <button type="button" className="vendor-table-btn" disabled={busy} onClick={() => handleEditSave(product.$id)}>Save</button>
                                                    <button type="button" className="vendor-table-btn" disabled={busy} onClick={handleEditCancel}>Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" className="vendor-table-btn" disabled={busy} onClick={() => handleEditStart(product)}>Edit</button>
                                                    <button type="button" className="vendor-table-btn vendor-table-btn--danger" disabled={busy} onClick={() => setDeleteTarget(product)}>Delete</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="vendor-orders-empty">No products found for your store.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {deleteTarget ? (
                <div className="vendor-delete-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="vendor-delete-modal">
                        <h3>Delete Product?</h3>
                        <p>This action is irreversible. The product will be permanently removed from your inventory.</p>
                        <div className="vendor-delete-modal-actions">
                            <button type="button" className="vendor-table-btn" disabled={busy} onClick={() => setDeleteTarget(null)}>Cancel</button>
                            <button type="button" className="vendor-table-btn vendor-table-btn--danger" disabled={busy} onClick={handleDeleteConfirm}>Delete Permanently</button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default VendorInventoryTable;
