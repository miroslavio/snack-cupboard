import React from 'react';
import { Trash2, ShoppingCart } from 'lucide-react';
import './Basket.css';

export default function Basket({ items, onRemoveItem, onCheckout, staffName }) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="basket">
            <div className="basket-header">
                <ShoppingCart size={24} />
                <h3>Your Basket</h3>
            </div>

            {items.length === 0 ? (
                <div className="empty-basket">
                    <p>Your basket is empty</p>
                    <p>Select items to add them here</p>
                </div>
            ) : (
                <>
                    <div className="basket-items">
                        {items.map((item) => (
                            <div key={item.id} className="basket-item">
                                <div className="item-details">
                                    <div className="item-name">{item.name}</div>
                                    <div className="item-quantity">
                                        <span>{item.quantity}x</span>
                                        <span className="item-price">£{(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    className="remove-btn"
                                    onClick={() => onRemoveItem(item.id)}
                                    title="Remove item"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="basket-divider"></div>

                    <div className="basket-summary">
                        <div className="summary-row">
                            <span>Items:</span>
                            <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                        <div className="summary-total">
                            <span>Total:</span>
                            <span>£{total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button className="checkout-btn" onClick={onCheckout}>
                        Checkout
                    </button>
                </>
            )}
        </div>
    );
}
