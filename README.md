**Societybasket**

 One Society. One Bulk Order. Better Prices for Everyone.

**SocietyBasket** is a community-based grocery group-buying platform that helps families in residential societies save money by combining their grocery orders into a single bulk purchase.
Instead of every family buying groceries separately, SocietyBasket brings neighbours together, combines their requirements, researches supplier prices using TinyFish, and identifies potential bulk-buying savings.
The idea is inspired by the community group-buying model popularized by platforms such as Pinduoduo in China, adapted for Indian residential societies.
Our goal is simple: **help people buy groceries together, pay less, and make collective purchasing easy.**

**The Problem :**
Imagine a residential society with 100 flats.
One family buys 5 kg of rice.
Another family buys 5 kg of rice.
A third family buys 10 kg of rice.
Other families purchase cooking oil, detergent, flour, and household essentials.
Everyone purchases separately, even though they live in the same building and may need the same products.
When people buy individually, they may miss out on bulk discounts that wholesalers can offer for larger orders.

**The main problems :**

**1.Fragmented demand:** Families place separate orders instead of combining their requirements.
**2.Higher purchasing costs:** Individual buyers may not receive the discounts available on bulk orders.
**3.Limited price comparison:** Finding and comparing supplier prices manually takes time.
**4.Unused collective buying power:** A residential society may have enough combined demand to negotiate a better price, but that demand is rarely organized.

**Our Solution :**
SocietyBasket turns individual grocery requirements into one combined community order.
For example, if 30 families need rice, cooking oil, and detergent, the platform combines their requirements, researches available supplier prices, compares offers, and calculates potential savings.
This creates value for everyone:

**Families:** Get the opportunity to purchase groceries at lower prices.
**Suppliers:** Receive larger, consolidated orders.
**SocietyBasket:** Connects community demand with supplier offers.

The platform focuses on one central idea: **collective purchasing power can help residential communities save money.**

**How SocietyBasket Works :**

 1. Families select their groceries :
Residents choose the products and quantities they need, such as rice, cooking oil, flour, detergent, and cleaning supplies.

 2. The platform combines everyone's orders :
SocietyBasket adds the individual quantities to calculate the society's total requirement.
For example:
| Family    | Rice required |
| Family A  |          5 kg |
| Family B  |          5 kg |
| Family C  |         10 kg |
| Family D  |         10 kg |
| **Total** |     **30 kg** |

Instead of four separate purchases, the platform identifies a combined requirement of 30 kg.

 3. TinyFish researches supplier prices :
TinyFish helps the platform search supported supplier websites and collect available product and pricing information.
This reduces the manual effort involved in researching suppliers and finding comparable offers.

 4. The platform compares prices :
SocietyBasket compares the available supplier offers for the required products and quantities.
It can calculate the difference between the individual-purchase price and the proposed bulk-purchase price.

5. Families see potential savings :
The platform displays the price comparison so families can understand whether purchasing together offers a financial advantage.
Actual savings depend on supplier quotations, product equivalence, delivery costs, and confirmed discounts.
 
6. The bulk order is confirmed :
Once the supplier confirms the price and availability, the consolidated order can be placed according to the agreed purchasing arrangements.

**Core Features :**

 1. Community Group Buying :
SocietyBasket allows residents of a residential society to combine their grocery requirements into a shared buying opportunity.
Instead of purchasing separately, families contribute to a common order that can qualify for better bulk pricing.

 2. Automatic Order Aggregation :
The platform combines individual shopping lists and calculates the total quantity required for each product.
For example, if 20 families order rice in different quantities, SocietyBasket calculates the combined requirement automatically.
This makes it easier to organize bulk purchases without manually adding every family's order.

3. TinyFish-Powered Supplier Research :
TinyFish is used as the web-research and automation component of the platform.

It can help SocietyBasket:
1.Search supported supplier websites.
2.Collect publicly available product information.
3.Retrieve listed prices where available.
4.Find relevant supplier offers.
5.Gather information that can be used for price comparison.
The collected information helps the platform understand the available purchasing options.

4. Bulk Price Comparison :
SocietyBasket compares supplier offers to identify potentially better prices for the community's combined order.
The comparison considers the product, quantity, listed price, and relevant additional costs where available.
For example, a product that costs ₹500 at an individual-purchase price might be offered for ₹440 through a confirmed bulk deal.
The platform can show the difference so residents understand the potential savings.
These figures are illustrative and do not represent actual supplier offers.

5. AI-Powered Shopping Assistant :
An AI shopping assistant can help families describe their grocery requirements in natural language.
For example:
"Help me prepare a grocery list for my family."
"Suggest groceries within a ₹2,000 budget."
"Which products can I include in the society's next bulk order?"

The AI helps interpret these requests and organize them into useful shopping requirements.
This feature can use an existing language model rather than requiring the development of a new AI model.

 6. AI-Assisted Product Matching :
Different suppliers may describe similar products in different ways.
AI can help identify potentially equivalent product listings so that SocietyBasket can compare relevant offers more effectively.
For accurate comparisons, important details such as brand, package size, product grade, and quantity must still be checked.

7. Machine Learning for Demand Prediction :
As SocietyBasket collects sufficient historical order data, machine learning can help estimate the quantities of groceries a community may need in future buying cycles.
For example, the system could learn from previous orders to estimate how much rice, cooking oil, or detergent a society might require next month.
This can help identify products that are suitable for future group-buying campaigns.
Demand prediction is a planned capability that becomes more useful as reliable historical data becomes available.


**Why TinyFish?**
One of the main challenges in group buying is finding suitable suppliers and comparing their prices.
Manually visiting different supplier websites and collecting product information can be time-consuming.
TinyFish can help automate supported browser-based research workflows, allowing the application to collect relevant information from accessible supplier websites.

**How TinyFish fits into SocietyBasket:**

1. SocietyBasket generates a consolidated list of required products.
2. TinyFish researches supported supplier websites.
3. Available product and pricing information is collected.
4. SocietyBasket organizes and compares the retrieved information.
5. The platform identifies potentially attractive supplier offers.

TinyFish supports the supplier-research process, while SocietyBasket's own application logic handles order aggregation and savings calculations.
Supplier availability, private quotations, and negotiated discounts must still be verified.

**Why AI and Machine Learning?**
AI and machine learning improve different parts of the SocietyBasket experience.

**Artificial intelligence (AI)** can help users describe their grocery requirements naturally and assist with understanding and matching product information.

**Machine learning (ML)** can learn patterns from historical orders and estimate future demand.
For example, if a society repeatedly orders similar quantities of rice every month, a forecasting model could use that history to estimate the next month's requirement.
Not every feature requires ML. Combining orders, adding quantities, and calculating price differences are handled by ordinary application logic.
This combination keeps the platform practical while leaving room for more intelligent features as data becomes available.


**Proposed Technology Architecture :**

SocietyBasket combines a grocery-ordering interface, application logic, supplier research, and AI capability.
                      
1.Frontend : HTML, CSS, JavaScript   
2.Backend : Python and Flask      
3.Database : SQLite or Firebase   
4.Web Search : TinyFish                 
5.AI Assistant: Existing LLM API        
6.Data Processing : Python             
7.Machine Learning: Python and scikit-learn                 


**Development Goals :**

SocietyBasket's development focuses on the core group-buying model:

1. Create the grocery-ordering interface.
2. Allow families to select products and quantities.
3. Aggregate individual orders into a community order.
4. Integrate TinyFish for supported supplier research.
5. Collect and organize supplier price information.
6. Compare available prices and calculate potential savings.
7. Add an AI-powered shopping assistant.
8. Explore AI-assisted product matching.
9. Develop ML-based demand prediction when sufficient historical data is available.


**Our Vision :**

We believe that communities should be able to use their combined purchasing power to access better prices on everyday essentials.
SocietyBasket aims to make group buying simple: families select what they need, the platform combines their orders, supplier offers are researched and compared, and the community can make a more informed purchasing decision.
By combining community group buying with TinyFish-powered supplier research and AI-assisted features, SocietyBasket aims to make collective purchasing more accessible to Indian residential societies.
One society. One bulk order. Better prices for everyone.
