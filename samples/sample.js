var PlListComponent = React.createClass({
  getInitialState() {
    return this.getStateFromStore();
  },
  componentWillMount() {
    ListStore.addChangeListener(this._onChange);
  },
  componentWillUnMount() {
    ListStore.removeChangeListener(this._onChange);
  },
  mixins: [IntlMixin],

  render() {
    var a=42;
    return (
      <div className="tab-content  ">
        <table className="table table-bordered table-striped ">
          <thead>
            <tr>
              <th className="property-col" onClick={()=> {
                AppActionCreator.sortByIndex(a);
              }}>&#x256A;  Property</th>
              <th className="price-col"  onClick={()=> {
                AppActionCreator.sortByIndex(1);
              }}>&#x256A; Price</th>
              <th className="bedrooms-col"
                onClick={()=> {
                  AppActionCreator.sortByIndex(2);
                }}>&#x256A; Bedrooms</th>
              <th className="published-col" onClick={()=> {
                AppActionCreator.sortByIndex(3);
              }}>&#x256A; Published</th>
            </tr>
          </thead>
          <tbody>
        {this.state.listing.map((item) => {
          var price  = Number(item.price)
          return (
            <tr>
              <td className="property-col" >{item.agent_name}</td>
              <td className="price-col">
                Â£{(price >= 1000000 ) ? (price / 1000000)+'M' : ( (price > 1000) ? (price / 1000)+'K' : price)}
              </td>
              <td className="bedrooms-col">{item.num_bedrooms}</td>
              <td className="published-col">
                <FormattedDate value={item.first_published_date} day="numeric" month="short" year="numeric" />
              </td>
            </tr>
          );
        })}
          </tbody>
        </table>
      </div>
    );
  },
  _onChange() {
    this.setState(this.getStateFromStore())
  },
  getStateFromStore() {
    return ListStore.getState()
  }
});

module.exports = PlListComponent;
