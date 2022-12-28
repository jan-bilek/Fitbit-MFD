//metric / imperial
//heart rate zones
//next day weather
//Open Weather Map API


function InformedFace(props) {
  return (
    <Page>
      <Section
        
        
        title={<Text bold align="center">Multifunctional Face Display Settings</Text>}>
        
        <TextInput settingsKey="OWMAPIKey" label="Open Weather Map API Key">API key</TextInput>
        <Select
          settingsKey="unitsMI"
          label="Metric / imperial units"
          options={[
            {name: 'Metric', value: 0},
            {name: 'Imperial', value: 1}
          ]}
        />
        
        <Text bold align="center" settingsKey="hrRange1lbl">Heart rate color ranges</Text>
        <Slider
          label="HR Range 1"
          settingsKey="hrRange1Value"
          min="5"
          max="220"
          step="5"
          onChange={value => props.settingsStorage.setItem('hrRange1lbl', value)}
        />
        <ColorSelect
          label="HR Range 1"
          settingsKey="hrRange1Color"
          colors={[
            {color: '#a5e3c4'},
            {color: '#ffffff'},
            {color: '#faf591'},
            {color: '#f7c560'},
            {color: '#f07d3e'},
            {color: '#ed1148'}
          ]}
        />
                
      </Section> 
    </Page>
  );
}

registerSettingsPage(InformedFace);