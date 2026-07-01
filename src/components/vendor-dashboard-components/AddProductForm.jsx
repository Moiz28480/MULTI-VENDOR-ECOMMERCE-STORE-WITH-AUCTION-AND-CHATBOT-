import { useEffect, useState } from 'react';
import { ID, Permission, Query, Role } from 'appwrite';
import { databases, storage } from '../../lib/appwrite.js';
import { useAuth } from '../../lib/auth-context.js';
import './AddProductForm.css';

const DATABASE_ID = '69c1cfaf003a710f1232';
const PRODUCTS_COLLECTION_ID = 'products';
const AUCTIONS_COLLECTION_ID = 'auctions';
const PRODUCT_IMAGES_BUCKET_ID = 'product_images';

const createInitialFormState = (defaultCategory = '') => ({
    listType: 'retail',
    name: '',
    price: '',
    category: defaultCategory,
    stock: '',
    description: '',
    auctionStartingBid: '',
    auctionStartType: 'now',
    auctionStartAt: '',
    auctionDurationHours: '24',
});

const fetchAllProductDocuments = async () => {
    const documents = [];
    let cursor = null;

    do {
        const queries = [Query.limit(100)];

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, queries);
        const batch = response?.documents || [];

        documents.push(...batch);
        cursor = batch.length ? batch[batch.length - 1].$id : null;

        if (batch.length < 100) {
            break;
        }
    } while (cursor);

    return documents;
};

const AddProductForm = ({ embedded = false, onSuccess = () => {}, onCancel = null }) => {
    const { user } = useAuth();
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [formData, setFormData] = useState(createInitialFormState(''));
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadCategoryOptions = async () => {
            setCategoriesLoading(true);

            try {
                const productDocs = await fetchAllProductDocuments();
                const uniqueCategories = Array.from(new Set(
                    productDocs
                        .map((product) => String(product?.category || '').trim())
                        .filter(Boolean),
                )).sort((a, b) => a.localeCompare(b));

                setCategoryOptions(uniqueCategories);
                setFormData((previous) => ({
                    ...previous,
                    category: uniqueCategories.includes(previous.category)
                        ? previous.category
                        : (uniqueCategories[0] || ''),
                }));
            } catch (loadError) {
                setCategoryOptions([]);
                setError(loadError?.message || 'Unable to load categories from database.');
            } finally {
                setCategoriesLoading(false);
            }
        };

        loadCategoryOptions();
    }, []);

    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((previous) => ({
            ...previous,
            ...(name === 'listType' && value === 'auction'
                ? { stock: '1' }
                : {}),
            [name]: value,
        }));
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0] || null;
        setError('');
        setSuccess('');

        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }

        if (!file) {
            setImageFile(null);
            setImagePreview('');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setImageFile(file);
        setImagePreview(previewUrl);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        const vendorId = localStorage.getItem('vendorId') || user?.$id;

        if (!vendorId) {
            setError('No vendor session found. Please log in again.');
            return;
        }

        if (!imageFile) {
            setError('Please select a product image.');
            return;
        }

        if (!formData.category) {
            setError('No category found in database. Add at least one category in products first.');
            return;
        }

        if (formData.listType === 'auction') {
            const startBid = Number(formData.auctionStartingBid);
            const durationHours = Number(formData.auctionDurationHours);

            if (!Number.isFinite(startBid) || startBid <= 0) {
                setError('Please enter a valid auction starting bid greater than 0.');
                return;
            }

            if (!Number.isFinite(durationHours) || durationHours < 1) {
                setError('Auction duration must be at least 1 hour.');
                return;
            }

            if (formData.auctionStartType === 'schedule') {
                const scheduledStartMs = new Date(formData.auctionStartAt).getTime();
                if (!Number.isFinite(scheduledStartMs)) {
                    setError('Please enter a valid scheduled start date and time.');
                    return;
                }

                if (scheduledStartMs <= Date.now()) {
                    setError('Scheduled start time must be in the future.');
                    return;
                }
            }
        }

        setSubmitting(true);

        try {
            const authUserId = user?.$id || localStorage.getItem('userId') || vendorId;

            const filePermissions = authUserId
                ? [
                    Permission.read(Role.any()),
                    Permission.write(Role.user(authUserId)),
                ]
                : [Permission.read(Role.any())];

            const uploadedFile = await storage.createFile(
                PRODUCT_IMAGES_BUCKET_ID,
                ID.unique(),
                imageFile,
                filePermissions,
            );

            const fileView = storage.getFileView(PRODUCT_IMAGES_BUCKET_ID, uploadedFile.$id);
            const imageUrl = typeof fileView === 'string' ? fileView : fileView?.href || '';

            if (!imageUrl) {
                throw new Error('Could not generate image URL from Appwrite storage.');
            }

            const productDocument = await databases.createDocument(
                DATABASE_ID,
                PRODUCTS_COLLECTION_ID,
                ID.unique(),
                {
                    name: formData.name.trim(),
                    price: Number(formData.price),
                    category: formData.category,
                    stock: formData.listType === 'auction' ? 1 : Number(formData.stock),
                    description: formData.description.trim(),
                    imageUrl,
                    vendorId,
                    list_type: formData.listType,
                },
                authUserId
                    ? [
                        Permission.read(Role.any()),
                        Permission.write(Role.user(authUserId)),
                    ]
                    : [Permission.read(Role.any())],
            );

            if (formData.listType === 'auction') {
                const startBid = Number(formData.auctionStartingBid);
                const durationHours = Number(formData.auctionDurationHours);
                const startAtMs = formData.auctionStartType === 'schedule'
                    ? new Date(formData.auctionStartAt).getTime()
                    : Date.now();

                const endTime = new Date(startAtMs + durationHours * 60 * 60 * 1000).toISOString();
                const status = formData.auctionStartType === 'schedule' ? 'upcoming' : 'active';
                const scheduledStartIso = formData.auctionStartType === 'schedule'
                    ? new Date(startAtMs).toISOString()
                    : null;

                await databases.createDocument(
                    DATABASE_ID,
                    AUCTIONS_COLLECTION_ID,
                    ID.unique(),
                    {
                        product_id: productDocument.$id,
                        seller_id: vendorId,
                        title: formData.name.trim(),
                        starting_bid: startBid,
                        current_bid: startBid,
                        status,
                        end_time: endTime,
                        bid_count: 0,
                        version: 1,
                        ...(scheduledStartIso ? { last_bid_at: scheduledStartIso } : {}),
                    },
                    authUserId
                        ? [
                            Permission.read(Role.any()),
                            Permission.write(Role.user(authUserId)),
                        ]
                        : [Permission.read(Role.any())],
                );
            }

            setSuccess(formData.listType === 'auction'
                ? 'Auction product added and auction started successfully.'
                : 'Retail product added successfully.');
            setFormData(createInitialFormState(categoryOptions[0] || ''));
            setImageFile(null);
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
            setImagePreview('');
            onSuccess();
        } catch (submitError) {
            setError(submitError?.message || 'Unable to add product.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`add-product-shell${embedded ? ' add-product-shell--embedded' : ''}`}>
            <form className="add-product-card" onSubmit={handleSubmit}>
                <div className="add-product-header-row">
                    <h2>Add Product</h2>
                    {onCancel ? (
                        <button type="button" className="add-product-cancel-btn" onClick={onCancel}>Close</button>
                    ) : null}
                </div>

                <div className="add-product-list-type-row">
                    <label>
                        <span>List Type</span>
                        <select
                            name="listType"
                            value={formData.listType}
                            onChange={handleInputChange}
                        >
                            <option value="retail">Retail</option>
                            <option value="auction">Auction</option>
                        </select>
                    </label>
                    <p className="add-product-list-type-hint">
                        {formData.listType === 'auction'
                            ? 'Auction selected: this will also create a live auction entry.'
                            : 'Retail selected: product will be listed in the standard store flow.'}
                    </p>
                </div>

                <div className="add-product-grid">
                    <label>
                        <span>Name</span>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </label>

                    <label>
                        <span>Price</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                        />
                    </label>

                    <label>
                        <span>Category</span>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            disabled={categoriesLoading || !categoryOptions.length}
                        >
                            {categoryOptions.map((option) => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Stock</span>
                        <input
                            type="number"
                            min="0"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            disabled={formData.listType === 'auction'}
                            required
                        />
                    </label>

                    <label className="add-product-description">
                        <span>Description</span>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            required
                        />
                    </label>

                    <label className="add-product-image-input">
                        <span>Product Image</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            required
                        />
                    </label>

                    {formData.listType === 'auction' ? (
                        <div className="add-product-auction-box">
                            <h3>Auction Details</h3>
                            <div className="add-product-auction-grid">
                                <label>
                                    <span>Starting Bid</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        name="auctionStartingBid"
                                        value={formData.auctionStartingBid}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>

                                <label>
                                    <span>Auction Start</span>
                                    <select
                                        name="auctionStartType"
                                        value={formData.auctionStartType}
                                        onChange={handleInputChange}
                                    >
                                        <option value="now">Start now</option>
                                        <option value="schedule">Schedule start</option>
                                    </select>
                                </label>

                                {formData.auctionStartType === 'schedule' ? (
                                    <label>
                                        <span>Start Date & Time</span>
                                        <input
                                            type="datetime-local"
                                            name="auctionStartAt"
                                            value={formData.auctionStartAt}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </label>
                                ) : null}

                                <label>
                                    <span>Auction Duration (Hours)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="720"
                                        name="auctionDurationHours"
                                        value={formData.auctionDurationHours}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </label>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="add-product-preview-box">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Selected product preview" />
                    ) : (
                        <p>Image preview appears here</p>
                    )}
                </div>

                {error ? <p className="add-product-error">{error}</p> : null}
                {!categoriesLoading && !categoryOptions.length ? (
                    <p className="add-product-error">No categories found in database products.</p>
                ) : null}
                {success ? <p className="add-product-success">{success}</p> : null}

                <button type="submit" className="add-product-btn" disabled={submitting || categoriesLoading || !categoryOptions.length}>
                    {submitting
                        ? (formData.listType === 'auction' ? 'Adding Auction Product...' : 'Adding Retail Product...')
                        : (formData.listType === 'auction' ? 'Create Auction Product' : 'Add Retail Product')}
                </button>
            </form>
        </div>
    );
};

export default AddProductForm;
